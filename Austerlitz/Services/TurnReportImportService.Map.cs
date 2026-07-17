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
        private int LoadTRMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                var xStart = 0;
                var coordinatesOnALine = new TR_MapCoordinates[40];
                var y = 0;

                const string mapBoundaryEurope1 = "    1  2  3  4  5  6  7  8  9";
                const string mapBoundaryEurope2 = "   41 42 43 44 45 46 47 48 49 50";
                const string mapBoundaryCarribean = "    1  2  3  4  5  6  7  8  9 10";
                const string mapBoundaryIndies = "   51 52 53 54 55 56 57 58 59 60";
                var mapBoundaryText = mapBoundaryEurope1;

                var existingCoordinates = auDB.TR_MapCoordinates.Where(z => z.TurnId == turnId);
                auDB.TR_MapCoordinates.RemoveRange(existingCoordinates);

                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                    {
                        if (locationFound)
                        {
                            locationFound = false;
                            if (mapBoundaryText == mapBoundaryEurope1) mapBoundaryText = mapBoundaryEurope2;
                            else if (mapBoundaryText == mapBoundaryEurope2) mapBoundaryText = mapBoundaryCarribean;
                            else if (mapBoundaryText == mapBoundaryCarribean) mapBoundaryText = mapBoundaryIndies;
                            else if (mapBoundaryText == mapBoundaryIndies) break;
                        }
                        else
                        {
                            locationFound = true;
                            lineLocation += 1;
                            lineToProcess = lineList[lineLocation].ToString();
                            if (mapBoundaryText == mapBoundaryEurope1) { xStart = 1; y = 1; }
                            else if (mapBoundaryText == mapBoundaryEurope2) { xStart = 41; y = 1; }
                            else if (mapBoundaryText == mapBoundaryCarribean) { xStart = 1; y = 70; }
                            else if (mapBoundaryText == mapBoundaryIndies) { xStart = 51; y = 70; }
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                    {
                        break;
                    }

                    for (var x = xStart; x < xStart + 40; x++)
                    {
                        var coordinate = lineToProcess.Substring(3 + (x - xStart) * 3, 3);
                        var newCoordinate = new TR_MapCoordinates
                        {
                            X = x,
                            Y = y,
                            TurnId = turnId,
                            State = coordinate.Substring(0, 1),
                            Population = coordinate.Substring(1, 1),
                            ProductionSite = coordinate.Substring(2, 1)
                        };
                        coordinatesOnALine[x - xStart] = newCoordinate;
                    }

                    auDB.TR_MapCoordinates.AddRange(coordinatesOnALine);
                    auDB.SaveChanges();
                    y++;
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTRMap: " + ex.Message, ex);
            }
        }
    }
}
