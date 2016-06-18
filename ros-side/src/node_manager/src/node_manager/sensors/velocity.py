from node_manager.helpers import wrappers
from node_manager.helpers.service import Service
from node_manager.srv import JSON


class Velocity(Service):

    def __init__(self, owner):
        Service.__init__(self, owner, '~sensors/velocity', JSON)


    @wrappers.service_json
    def __call__(self): 
        try: v = self.owner.properties['geometry']['v']
        except: print 'exception'; v = 0
        return v