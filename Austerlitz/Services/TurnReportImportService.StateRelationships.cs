using Austerlitz.DAL;
using Austerlitz.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Austerlitz.Services
{
    public partial class TurnReportImportService
    {
        private int LoadStateRelationships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var originalLineLocation = lineLocation;
                var existingRecords = auDB.TR_StateRelationships.Where(x => x.TurnId == turnId);
                auDB.TR_StateRelationships.RemoveRange(existingRecords);
                auDB.SaveChanges();

                var parsedRelationshipLines = new List<ParsedRelationshipLine>();
                var relationshipLineFound = false;

                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    var parsedLine = ParseRelationshipLine(lineToProcess);
                    if (parsedLine != null)
                    {
                        relationshipLineFound = true;
                        parsedRelationshipLines.Add(parsedLine);
                        continue;
                    }

                    if (relationshipLineFound)
                    {
                        break;
                    }

                    if (!string.IsNullOrWhiteSpace(lineToProcess))
                    {
                        break;
                    }
                }

                if (parsedRelationshipLines.Count == 0)
                {
                    return originalLineLocation;
                }

                var relationshipBySourceAndTarget = new Dictionary<string, ParsedRelationshipPair>(StringComparer.OrdinalIgnoreCase);
                foreach (var relationshipLine in parsedRelationshipLines)
                {
                    var targetRelationships = ParseRelationshipPairs(relationshipLine.PairsText);
                    foreach (var targetRelationship in targetRelationships)
                    {
                        var key = relationshipLine.SourceState + "|" + targetRelationship.Key;
                        relationshipBySourceAndTarget[key] = new ParsedRelationshipPair
                        {
                            SourceState = relationshipLine.SourceState,
                            TargetState = targetRelationship.Key,
                            Relationship = targetRelationship.Value
                        };
                    }
                }

                foreach (var relationship in relationshipBySourceAndTarget.Values)
                {
                    auDB.TR_StateRelationships.Add(new TR_StateRelationships
                    {
                        TurnId = turnId,
                        SourceState = relationship.SourceState,
                        State = relationship.TargetState,
                        Relationship = relationship.Relationship
                    });
                }

                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadStateRelationships: " + ex.Message, ex);
            }
        }

        private static ParsedRelationshipLine ParseRelationshipLine(string lineToProcess)
        {
            if (string.IsNullOrWhiteSpace(lineToProcess))
            {
                return null;
            }

            var lineMatch = Regex.Match(
                lineToProcess,
                @"^Relationship of\s+(?<source>[A-Za-z])\s+to other countries:\s*(?<pairs>.+)$",
                RegexOptions.IgnoreCase);
            if (!lineMatch.Success)
            {
                return null;
            }

            return new ParsedRelationshipLine
            {
                SourceState = (lineMatch.Groups["source"].Value ?? string.Empty).Trim().ToUpperInvariant(),
                PairsText = lineMatch.Groups["pairs"].Value ?? string.Empty
            };
        }

        private static Dictionary<string, int> ParseRelationshipPairs(string pairsText)
        {
            var results = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(pairsText))
            {
                return results;
            }

            var pairMatches = Regex.Matches(pairsText, @"(?<state>[A-Za-z])\s*-\s*(?<value>\d+)");
            foreach (Match pairMatch in pairMatches)
            {
                if (!pairMatch.Success)
                {
                    continue;
                }

                var targetState = (pairMatch.Groups["state"].Value ?? string.Empty).Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(targetState))
                {
                    continue;
                }

                int relationshipValue;
                if (!int.TryParse(pairMatch.Groups["value"].Value, out relationshipValue))
                {
                    continue;
                }

                results[targetState] = relationshipValue;
            }

            return results;
        }

        private class ParsedRelationshipLine
        {
            public string SourceState { get; set; }
            public string PairsText { get; set; }
        }

        private class ParsedRelationshipPair
        {
            public string SourceState { get; set; }
            public string TargetState { get; set; }
            public int Relationship { get; set; }
        }
    }
}
