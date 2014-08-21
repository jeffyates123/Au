using Microsoft.Practices.Unity;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Web.Http;
using System.Web.Http.Routing;

namespace Austerlitz.App_Start
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // requires separate set-up for Web Api Calls
            var container = new UnityContainer();

            //container.RegisterType<MoodWorkout.DAL.IQuestionDA, MoodWorkout.DAL.QuestionDA>(new HierarchicalLifetimeManager());
            //container.RegisterType<MoodWorkout.DAL.ISurveyDA, MoodWorkout.DAL.SurveyDA>(new HierarchicalLifetimeManager());

            config.DependencyResolver = new Austerlitz.App_Start.UnityResolver(container); // resolve the web api dependencies via the unity container

            // http://stackoverflow.com/questions/9499794/single-controller-with-multiple-get-methods-in-asp-net-web-api
            //
            config.Routes.MapHttpRoute("DefaultApiWithId", "Api/{controller}/{id}", new { id = RouteParameter.Optional }, new { id = @"\d+" });
            config.Routes.MapHttpRoute("DefaultApiWithAction", "Api/{controller}/{action}");
            config.Routes.MapHttpRoute("DefaultApiGet", "Api/{controller}", new { action = "Get" }, new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) });
            config.Routes.MapHttpRoute("DefaultApiPost", "Api/{controller}", new { action = "Post" }, new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) });

            // format return for api to have their default Pascal-case Json converted to CamelCase instead.
            var jsonFormatter = GlobalConfiguration.Configuration.Formatters.JsonFormatter;
            jsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();

        }

    }
}