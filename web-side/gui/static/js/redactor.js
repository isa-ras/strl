function mainScope($scope) {

    /* Получить ID мира из URL */

    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // проверка на корректность url - должен содержать ID выбранного мира

    if (!getParameterByName("worldid"))
        console.log("URL НЕ СОДЕРЖИТ ID МИРА - НАДО ЗАБЛОКИРОВАТЬ ЭКРАН");

    else {
        $scope.worldID = getParameterByName("worldid");

        $scope.listOfObject = {} ;       // хранится список всех созданных объектов по типам


        /* Запрос на получение списка типов объектов */

        $.ajax('/api/object_types', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            dataType: "json"
        }).fail(function () {

        }).done(function (result) {
            $scope.objectTypes = result;
            $scope.$scan();
        });


        /* Запрос на получение списка объектов */

        $.ajax('/api/worlds/'+$scope.worldID+'/objects', {
            method: 'GET',
            headers: {'Content-Type': 'application/json; charset=UTF-8'},
            dataType: "json"
        }).fail(function () {
            console.error("Нет мира с ID "+$scope.worldID);
        }).done(function (result) {
            for (var i=0; i < result.length; i++) {
                var id = result[i].type_id;
                if (!$scope.listOfObject[id]) {
                    $scope.listOfObject[id] = {};
                    $scope.listOfObject[id].objs = [];
                }
                $scope.listOfObject[id].objs.push(result[i]);
            }
            for (id in $scope.listOfObject) {
                for (var i = 0; i < $scope.objectTypes.length; i++) {
                    if (id == $scope.objectTypes[i].id)
                        $scope.listOfObject[id] = $scope.objectTypes[i].name;
                }
            }
            $scope.$scan();
        });



        /* CANVAS */

        $scope.createCanvas = function () {
            jQuery(document).ready(function () {
                // задаем жестко ширину, чтобы не растягивалась
                // почему width растягивается, а height - нет???
                // TODO: придумать альтернативу
                jQuery('#canvas-container').width(jQuery('#canvas-container').width());

                $scope.canvas = new fabric.Canvas('canvas');
                // 1 inch = 96 pixels (1000 х 1000 - в чем измеряется?)
                // при 96000 x 96000 элементы прекращают отображаться
                $scope.canvas.setWidth(9600);
                $scope.canvas.setHeight(9600);
                $scope.canvas.renderAll();

                $scope.canvas.on('object:selected', function () {
                    var obj = $scope.canvas.getActiveObject();
                    $scope.activeObjWidth = obj.getWidth();
                    $scope.activeObjWidth = obj.getHeight();
                });
                $scope.canvas.objectCounter = {};
                $scope.canvas.objectCounter['group'] = 0;

                var redCarBody = new fabric.Rect({
                    left: 260,
                    top: 60,
                    width: 50,
                    height: 70
                });

                var redCarWheel1 = new fabric.Rect({
                    left: 250,
                    top: 40,
                    width: 10,
                    height: 40
                });

                var redCarWheel2 = new fabric.Rect({
                    left: 310,
                    top: 40,
                    width: 10,
                    height: 40
                });

                var redCarWheel3 = new fabric.Rect({
                    left: 310,
                    top: 110,
                    width: 10,
                    height: 40
                });

                var redCarWheel4 = new fabric.Rect({
                    left: 250,
                    top: 110,
                    width: 10,
                    height: 40
                });

                $scope.redCar = new fabric.Group([redCarBody, redCarWheel1, redCarWheel2, redCarWheel3, redCarWheel4], {
                    // left: 260,
                    //top: 60,
                    id: 'id-' + $scope.canvas.objectCounter['group']++,
                    fill: '#d99690',
                    lockScalingX: true,
                    lockScalingY: true,
                    lockRotation: true
                    //selectable: false

                });

                $scope.canvas.add($scope.redCar);
            });
        };

        $scope.createCanvas();


        /* Управление объектами на canvas */

        $scope.editObject = function (actionType) {
            $scope.actionType = actionType;
            if ($scope.canvas.getActiveObject()) {
                switch (actionType) {
                    case 'del':
                        var activeObject = $scope.canvas.getActiveObject();
                        $scope.canvas.remove(activeObject);
                        break;
                    case 'copy':
                        var selectObject = $scope.canvas.getActiveObject();
                        selectObject.clone(function (o) {
                            var cloneObject = o;
                            if (cloneObject) {
                                cloneObject.set({
                                    left: 150,
                                    top: 150
                                });
                                $scope.canvas.add(cloneObject);
                                cloneObject.set('fill', '#000');
                                cloneObject.set('width', 60);
                                $scope.canvas.renderAll();
                                $scope.canvas.calcOffset();
                            } else {
                                alert("Объект для клонирования не выбран");
                            }
                        });
                        break;
                    case 'route':
                        $scope.canvas.getActiveObject().set('angle', ($scope.canvas.getActiveObject().get('angle') + 90));
                        $scope.canvas.renderAll();
                        break;
                }
            }
        };
    }

    window.S = $scope;
}


