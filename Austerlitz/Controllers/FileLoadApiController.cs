using Austerlitz.Services;
using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class FileLoadApiController : ApiController
    {
        private readonly TurnReportImportService _turnReportImportService;

        public FileLoadApiController()
        {
            _turnReportImportService = new TurnReportImportService();
        }

        // Web API does not reliably populate HttpRequest.Files for multipart POSTs.
        // Read the body with ReadAsMultipartAsync (same pattern as MS Web API file-upload samples).

        [HttpPost]
        public async Task<HttpResponseMessage> FilePost()
        {
            string savedPath = null;
            try
            {
                if (!Request.Content.IsMimeMultipartContent())
                    return Request.CreateResponse(HttpStatusCode.UnsupportedMediaType, "Expected multipart/form-data.");

                var uploadDir = HttpContext.Current.Server.MapPath("~/App_Data/TurnUploads");
                Directory.CreateDirectory(uploadDir);

                var provider = new MultipartMemoryStreamProvider();
                await Request.Content.ReadAsMultipartAsync(provider);

                foreach (var part in provider.Contents)
                {
                    var disposition = part.Headers.ContentDisposition;
                    if (disposition == null)
                        continue;

                    var name = disposition.FileName;
                    if (string.IsNullOrWhiteSpace(name))
                        continue;

                    name = Path.GetFileName(name.Trim('"'));
                    if (string.IsNullOrEmpty(name))
                        continue;

                    savedPath = Path.Combine(uploadDir, Guid.NewGuid().ToString("N") + "_" + name);
                    using (var fs = File.Create(savedPath))
                    {
                        await part.CopyToAsync(fs);
                    }
                    break;
                }

                if (string.IsNullOrEmpty(savedPath))
                    return Request.CreateResponse(HttpStatusCode.BadRequest, "No file found in upload.");

                var loadedTurnId = _turnReportImportService.LoadTurnReport(savedPath);

                try { File.Delete(savedPath); }
                catch { /* ignore cleanup failures */ }

                return Request.CreateResponse(HttpStatusCode.Created, new { turnId = loadedTurnId });
            }
            catch (Exception ex)
            {
                if (!string.IsNullOrEmpty(savedPath))
                {
                    try { File.Delete(savedPath); } catch { }
                }
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
    }
}
