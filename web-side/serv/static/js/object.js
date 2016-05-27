define(['/static/libs/aplib.js'], function(aplib) {

    ap.jsdesc['object'] = {
        fields: { 
            data: { properties: {
                geometry: {
                    position: {x:0, y:0},
                    type: 'circle', 
                    radius: 10
                },
                active: false,
            },
            id: 0, time: 0
        } },

        methods: {
            get: { code: function(name) {
                var arr = name.split('.');
                var value = this.data;
                for (var i=0; i<arr.length; i++)
                    value = value[arr[i]];
                return value;
            } },

            get_prop: { code: function(name) { return this.get('properties.'+name); } },
            get_geom: { code: function(name) { return this.get_prop('geometry.'+name); } },
                        
            update_canvas: { code: function() {
                canvas = $('canvas[object="'+this.get('object')+'"]').first().get(0);
                if (!canvas) return;
                ctx = canvas.getContext('2d');

                x = this.get_geom('position.x');
                y = this.get_geom('position.y');

                if (this.get_geom('type') == 'circle') {
                    radius = this.get_geom('radius');
                    canvas.width = 2*radius;
                    canvas.height = 2*radius;

                    ctx.beginPath();
                    ctx.arc(radius, radius, radius, 0, Math.PI*2, true);
                    ctx.closePath();
                    ctx.fill();
                }
            } },

            get_array: { code: function(name) { 
                if (name == undefined) name = 'properties';
                array = [];
                for (var key in this.get(name)) {
                    field = name + '.' + key;
                    if (this.get(field) instanceof Object) {
                        array = array.concat(this.get_array(field)); 
                    } else {
                        var type = typeof this.get(field);
                        var constructor = this.get(field).constructor;
                        array.push({key: key, value: this.get(field),
                            name: field, link: this.get(name), 
                            type: type, constructor: constructor, 
                            object: this, update: this.update_field});
                    }
                }
                return array;
            } },

            update_field: { code: function(field) { 
                constructor = field.constructor;
                field.link[field.key] = constructor(field.value);
                field.object.update_canvas();
                field.value = field.link[field.key];
                
                if (field.key == 'active') {
                    if (field.value) field.object.get('properties')['program'] = ''
                    else delete field.object.get('properties')['program'];
                    scope.data.fields = field.object.get_array();
                }
            } }       
        }
    }

    var funcs = {
        update: function(data) {
            if (data['execution'] != scope.data.execution) return;
            var o = ap.walk.getObject2('object', data['object']);
            o.data = data;

            if (scope.objects.indexOf(o) == -1) scope.objects.push(o);
            if (scope.data.selected_object == o) scope.data.fields = o.get_array();
            scope.data.time = Math.max(o.get('time'), scope.data.time);

            scope.$scan();
            o.update_canvas();
        },

        index: function(data) {
            if (data['id'] != scope.data.execution) return;
            scope.objects = [];
            for (var ind in data['objects'])
                funcs.update(data['objects'][ind]);
            scope.$scan();
        },

        emit_index: function() {
            scope.data.time = scope['&time'].value;
            socket.emit('objects:index', scope.data);
        },

        create_object: function() {
            var obj_id = scope.objects.map(function(o){return o.get('object')});
            obj_id = Math.max.apply(Math, obj_id) + 1;
            var o = ap.walk.getObject2('object', obj_id);
            o.data.object = obj_id;
            o.data.execution = scope.data.execution;
            o.data.properties.name = 'new_object'+o.get('object');
            funcs.update(o.data);
            scope.data.selected = o.get('object');
        },

        remove_object: function(o) {
            if (!o) o = scope.data.selected_object;
            if (!o) return;

            var ind = scope.objects.indexOf(o);
            if (ind > -1) scope.objects.splice(ind, 1);
            delete ap.walk.class['object'][o.get('object')];
            scope.data.selected_object = null;
            scope.data.selected = null;
            scope.$scan();
        }
    }

    return {
        funcs: funcs,
        init: function() {
            scope.objects = [];
            scope.data.fields = [];

            scope.$watch('data.selected', function(value) { 
                if (!value) {
                    scope.data.fields = [];
                    scope.data.selected_object = null;
                    return;
                }

                object = ap.walk.getObject2('object', value);
                scope.data.fields = object.get_array();
                scope.data.selected_object = object;
            });

            socket.on('objects:update', funcs.update);
            socket.on('objects:index', funcs.index);
        },
    }
})
