using Microsoft.Practices.Unity;
using Microsoft.Practices.Unity.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Austerlitz.Web.App_Start
{

    public class IocControllerFactory : DefaultControllerFactory
    {
        private readonly IUnityContainer _container;

        public IocControllerFactory(IUnityContainer container)
        {
            _container = container;
        }

        protected override IController GetControllerInstance(RequestContext requestContext, Type controllerType)
        {
            if (controllerType != null)
                return _container.Resolve(controllerType) as IController;
            else
                return base.GetControllerInstance(requestContext, controllerType);
        }
    }
}