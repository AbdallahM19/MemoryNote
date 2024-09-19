from datetime import datetime
from modules.database import Comment, get_session


class Comments_class():
    """Comments"""

    def get_comment_by_user_id(self, user_id):
        """Get the first comment of a user by user_id."""
        session = get_session()
        try:
            result = session.query(Comment).filter(
                Comment.user_id == user_id
            ).first()
            return self.convert_object_comment_to_dictionary(result) if result else {}
        except Exception as e:
            print(f"Error getting comment by user_id: {e}")
        finally:
            session.close()

    def get_comment_by_memory_id(self, user_id):
        """Get the first comment of a user by user_id."""
        session = get_session()
        try:
            result = session.query(Comment).filter(
                Comment.user_id == user_id
            ).first()
            return self.convert_object_comment_to_dictionary(result) if result else {}
        except Exception as e:
            print(f"Error getting comment by memory_id: {e}")
        finally:
            session.close()

    def get_all_comments_by_user_id(self, user_id):
        """Get all comments of a user by user_id."""
        session = get_session()
        try:
            result = session.query(Comment).filter(
                Comment.user_id == user_id
            ).all()
            return [
                self.convert_object_comment_to_dictionary(c)
                for c in result
            ] if result else []
        except Exception as e:
            print(f"Error getting comments by user_id: {e}")
        finally:
            session.close()

    def get_all_comments_by_memory_id(self, memory_id):
        """Get all comments of a memory by memory_id."""
        session = get_session()
        try:
            result = session.query(Comment).filter(
                Comment.memory_id == memory_id
            ).all()
            return [
                self.convert_object_comment_to_dictionary(c)
                for c in result
            ] if result else []
        except Exception as e:
            print(f"Error getting comments by memory_id: {e}")
        finally:
            session.close()

    def insert_comment(self, comment, memory_id, user_id):
        """Create a new comment"""
        session = get_session()
        try:
            new_comment = Comment(
                user_id=user_id,
                memory_id=memory_id,
                comment=comment,
                timestamp=datetime.now().strftime("%a %b %d %H:%M:%S %Y")
            )
            session.add(new_comment)
            session.commit()
            return self.convert_object_comment_to_dictionary(new_comment)
        except Exception as e:
            session.rollback()
            print("Error inserting comment: {}".format(e))
        finally:
            session.close()

    def update_comment(self, comment_dict):
        """Edit a comment."""
        session = get_session()
        try:
            past_comment = session.query(Comment).filter(
                Comment.comment_id == comment_dict['comment_id']
            ).first()
            if past_comment:
                for key, value in comment_dict.items():
                    setattr(past_comment, key, value)
                session.commit()
            else:
                print("Comment not found.")
        except Exception as e:
            session.rollback()
            print("Error updating comment: {}".format(e))
        finally:
            session.close()

    def delete_comment(self, comment_id):
        """Delete a comment"""
        session = get_session()
        try:
            session.query(Comment).filter(
                Comment.comment_id == comment_id
            ).delete()
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            print("Error deleting comment: {}".format(e))
            return False
        finally:
            session.close()

    def convert_object_comment_to_dictionary(self, comment):
        """Convert a Comment object to a dictionary"""
        return {
            'comment_id': comment.comment_id,
            'user_id': comment.user_id,
            'memory_id': comment.memory_id,
            'comment': comment.comment,
            'timestamp': comment.timestamp
        } if comment else {}
