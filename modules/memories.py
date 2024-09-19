from modules.database import Memory, LikeList, Comment, get_session
from __init__ import or_, and_


class Memories():
    """Memories class"""
    def __init__(self):
        self.sess = get_session()

    def get_memories_by_id(self, memory_id):
        """get memory by id function"""
        memory = self.sess.query(Memory).filter(
            Memory.id == memory_id
        ).first()
        self.sess.close()
        return memory

    def get_memories(self):
        """get memory by id function"""
        memories = self.sess.query(Memory).all()
        self.sess.close()
        return memories

    def get_memories_for_user(self, user_id):
        """get memory by user_id function"""
        memories = self.sess.query(Memory).filter(
            Memory.user_id == user_id
        ).all()
        self.sess.close()
        return memories

    def get_memories_for_search(self, query, user_id):
        """get memory by search function"""
        memories = self.sess.query(Memory).filter(
            or_(
                and_(
                    or_(
                        Memory.title.like('%{}%'.format(query)),
                        Memory.description.like('%{}%'.format(query))
                    ),
                    Memory.share == 'Everyone',
                    Memory.type == 'Public'
                ),
                and_(
                    Memory.user_id == user_id,
                    or_(
                        Memory.title.like('%{}%'.format(query)),
                        Memory.description.like('%{}%'.format(query))
                    )
                )
            )
        ).all()
        self.sess.close()
        return [
            self.convert_object_to_dict_memory(memory)
            for memory in memories
        ]

    def create_new_memory(self, new_memory_data):
        """create new memory function"""
        try:
            new_memory = Memory(
                user_id = new_memory_data['user_id'],
                title = new_memory_data['title'],
                timestamp = new_memory_data['timestamp'],
                description = new_memory_data['description'],
                image = ','.join(new_memory_data['image']),
                share = new_memory_data['share'],
                type = new_memory_data['type'],
                calendar = new_memory_data['calendar'],
                likes = new_memory_data['liked']
            )
            self.sess.add(new_memory)
            self.sess.commit()
        except Exception as e:
            print("error occurred while creating memory {}".format(e))
            self.sess.rollback()
        finally:
            self.sess.close()

    def update_memory(self, memory_id, memory_new_data):
        """update memory function"""
        try:
            memory = self.sess.query(Memory).filter(
                Memory.id == memory_id
            ).first()
            if memory:
                for key, value in memory_new_data.items():
                    setattr(memory, key, value)
                self.sess.commit()
                return True
            return False
        except Exception as e:
            print("error occurred while updating memory {}".format(e))
            self.sess.rollback()
        finally:
            self.sess.close()

    def delete_memory(self, memory_id):
        """delete memory function"""
        try:
            memory = self.get_memories_by_id(memory_id)
            self.sess.delete(memory)

            self.sess.query(LikeList).filter(
                LikeList.memory_id == memory_id
            ).delete()

            self.sess.query(Comment).filter(
                Comment.memory_id == memory_id
            ).delete()

            self.sess.commit()
            return True
        except Exception as e:
            print("error occurred while deleting memory {}".format(e))
            self.sess.rollback()
        finally:
            self.sess.close()

    def convert_object_to_dict_memory(self, memory):
        """Convert memory object to dictionary."""
        return {
            'id': memory.id,
            'user_id': memory.user_id,
            'title': memory.title,
            'timestamp': memory.timestamp,
            'description': memory.description,
            'image':  (memory.image).split(',') if memory.image else [],
            'share': memory.share,
            'type': memory.type,
            'calendar': memory.calendar,
            'liked': memory.likes,
        }
