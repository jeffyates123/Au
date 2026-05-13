austerlitzModule.directive('editableCellDirective', function () {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            itemname: "=",
            editflag: "=",
        },
        template: "<div><span ng-hide='editflag'>{{itemname}}</span><input type='text' ng-show='editflag' ng-model='itemname'/></input>",

        link: function (scope, element, attrs) {

        }
    }
});
