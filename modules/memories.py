from os import path
from json import dump, load


class Memories():
    """Memories class"""
    def __init__(self):
        self.filename = 'memories.json'
        self.memories = self.load_memories_data()

    def check_if_file_exists(self):
        """check if file exists"""
        return path.exists(self.filename)

    def load_memories_data(self):
        """load memories data from json file"""
        if self.check_if_file_exists() is True:
            with open(self.filename, 'r') as f:
                return load(f)
        else:
            return []
    
    def get_memories_by_id(self, memory_id):
        """get memory by id function"""
        self.reload_memories_data()
        for memory in self.memories:
            if memory['id'] == int(memory_id):
                return memory

    def save_memories_data(self, data):
        """Save memory data to a JSON file."""
        self.memories.append(data)
        with open(self.filename, 'w') as f:
            dump(self.memories, f, indent=4)

    def save_all_memories_data(self):
        """Save memory data to a JSON file."""
        with open(self.filename, 'w') as f:
            dump(self.memories, f, indent=4)

    def reload_memories_data(self):
        """Reload memories data from the JSON file"""
        self.memories = self.load_memories_data()

    def search_memories_data(self, query):
        """Search memories data by query"""
        self.reload_memories_data()
        return [
            memory for memory in self.memories if query.lower() in memory['title'].lower() and memory['type'] not in ['Private', 'Draft', 'Schedule']
        ]

    def get_all_memories(self, user_id):
        """get memories function"""
        self.reload_memories_data()
        return [
            memory for memory in self.memories
            if memory['user_id'] == int(user_id) or memory['type'] == 'Public'
        ]

    def add_or_minus_like_function(self, memory_id, character):
        """add or minus like function"""
        self.reload_memories_data()
        for memory in self.memories:
            if memory['id'] == memory_id:
                if character == 'T':
                    memory['likes'] += 1
                elif character == 'F':
                    memory['likes'] -= 1
                self.save_all_memories_data()
                return True
        return False

    def convert_object_to_dict_memory(self, memory):
        """Convert memory object to dictionary."""
        return {
            'id': memory.id,
            'user_id': memory.user_id,
            'title': memory.title,
            'timestamp': memory.timestamp,
            'description': memory.description,
            'image':  (memory.image).split(','),
            'share': memory.share,
            'type': memory.type,
            'calendar': memory.calendar,
            'liked': memory.likes,
        }