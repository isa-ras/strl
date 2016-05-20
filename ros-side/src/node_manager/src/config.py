config ={
  'config': {
    'name': 'NodeManager',
    'create_world': 'create_world',
    'destroy_world': 'destroy_world',
  },

  'url': {
      'get_data': 'http://localhost:5000/executions/%s/get_data'
  },

  'root': '../../',
  'robots': {
    'root': 'robots',
    'runner': 'runner.py',
    'env': 'env.py',

    'config': 'config.xml',
    'launch': ['r', 's', 't'],
    'rate': {
      'r': 5,
      's': 15,
      't': 3
    }
  }
}

import os
config['root'] = os.path.join(os.path.dirname(__file__), config['root'])
