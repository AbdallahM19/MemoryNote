from werkzeug.security import generate_password_hash, check_password_hash
from modules.database import User, LikeList, Memory, Follower, get_session
from modules.comments import Comments_class
from __init__ import or_, and_
from datetime import datetime
from uuid import uuid4


comment_module = Comments_class()


class Users():
    """Users class"""
    def __init__(self):
        self.sess = get_session()
        self.current_user = {}
        self.list_fields_user = [
            'username', 'fullname', 'email', 'password',
            'confirmpass', 'session_id', 'reset_token',
            'description', 'dob', 'timecreated', 'image',
            'followingcount', 'followerscount'
        ]

    def hash_password(self, password):
        """User passwords should NEVER be stored in plain text in a database."""
        return generate_password_hash(password)

    def is_valid(self, hashed_password, password):
        """is_valid function that expects 2 arguments and returns a boolean."""
        return check_password_hash(hashed_password, password)

    def get_all_users(self):
        """returns all users in the database"""
        result = self.sess.query(User).all()
        self.sess.close()
        return result

    def get_user_by_username(self, username):
        """get user by username function"""
        user = self.sess.query(User).filter(
            User.username == username
        ).first()
        self.sess.close()
        return user

    def get_user_by_id(self, user_id):
        """get user by id function"""
        user = self.sess.query(User).filter(
            User.id == user_id
        ).first()
        self.sess.close()
        return user

    def get_user_by_session_id(self, session_id):
        """get user by session id function"""
        user = self.sess.query(User).filter(
            User.session_id == session_id
        ).first()
        self.sess.close()
        return user

    def get_users_for_search(self, query):
        """get users for search function"""
        users = self.sess.query(User).filter(
            User.username.like('%{}%'.format(query))
        ).all()
        self.sess.close()
        return [
            self.convert_object_to_dict_user(user)
            for user in users
        ]

    def create_user_in_table_user(self, user_data):
        """
        create user in table user function
        - Args:
            - user_data (dict): Dictionary containing user information.
        - Returns:
            - int: The ID of the newly inserted user.
        """
        user = User(
            username=user_data['username'],
            fullname=user_data['fullname'],
            email=user_data['email'],
            password=user_data['password'],
            confirmpass=user_data['confirmpass'],
            session_id=user_data['session_id'],
            reset_token=user_data['reset_token'],
            description=user_data['description'],
            dob=user_data['dob'],
            timecreated=user_data['timecreated'],
            image=user_data['image'],
            followingcount=user_data['followingcount'],
            followerscount=user_data['followerscount']
        )
        self.sess.add(user)
        self.sess.commit()
        self.sess.close()
        return user.id

    def update_user_in_table_user(self, user_data):
        """
        update user in table user function
        - Args:
            - user_data (dict): Dictionary containing user information.
        - Returns:
            - int: The ID of the updated user.
        """
        user = self.get_user_by_id(user_data['id'])
        for field in self.list_fields_user:
            if field in user_data:
                setattr(user, field, user_data[field])
        self.sess.commit()
        self.sess.close()

    def update_current_user_in_table_user(self):
        """update current user in table user function"""
        try:
            user = self.get_user_by_id(self.current_user['id'])
            for field in self.list_fields_user:
                setattr(user, field, self.current_user[field])
            self.sess.commit()
        except Exception as e:
            print(f"Error updating current user: {e}")
            self.sess.rollback()
        finally:
            self.sess.close()

    def check_if_user_exist(self, username, email):
        """check if user exist function"""
        user = self.sess.query(User).filter(
            or_(
                User.username == username,
                User.email == email
            )
        ).first()
        if user:
            return user
        return False

    def authenticate_user(self, username, password):
        """
        - Authenticate user function that expects 2 arguments
        - returns a boolean:
            - (True) if the user is authenticated
            - (False) if the user is not authenticated
        """
        user = self.check_if_user_exist(
            username, username
        )
        if user and (
            self.is_valid(user.password, password) or
            user.confirmpass == password,
        ):
            self.current_user = self.convert_object_to_dict_user(user)
            return self.current_user
        return False

    # --------------
    # like functions
    # --------------

    def add_like(self, memory_id):
        """add like function"""
        try:
            self.current_user['memories']['liked'].append(memory_id)
            self.sess.query(Memory).filter(
                Memory.id == memory_id
            ).first().likes += 1
            self.sess.add(
                LikeList(
                    memory_id=memory_id,
                    user_id=self.current_user['id']
                )
            )
            self.sess.commit()
        except Exception as e:
            print("Error adding like: {}".format(e))
            self.sess.rollback()
        finally:
            self.sess.close()

    def delete_like(self, memory_id):
        """delete like function"""
        try:
            self.current_user['memories']['liked'].remove(memory_id)
            self.sess.query(Memory).filter(
                Memory.id == memory_id
            ).first().likes -= 1
            self.sess.delete(
                self.sess.query(LikeList).filter(
                    and_(
                        LikeList.memory_id == memory_id,
                        LikeList.user_id == self.current_user['id']
                    )
                ).first()
            )
            self.sess.commit()
        except Exception as e:
            print("Error deleting like: {}".format(e))
            self.sess.rollback()
        finally:
            self.sess.close()

    def get_likes(self, user_id):
        """Get likes of a user_id"""
        result = self.sess.query(LikeList).filter(
            LikeList.user_id == user_id
        ).all()
        self.sess.close()
        return [l.memory_id for l in result] if result else []

    # ----------------
    # follow functions 
    # ----------------

    def get_follow_or_following(self, user_id):
        """Get follow or following user"""
        try:
            return self.sess.query(Follower).filter(
                and_(
                    Follower.user_id == self.current_user['id'],
                    Follower.follower_id == user_id
                )
            ).first()
        except Exception as e:
            print("Error getting follow or following user: {}".format(e))
            return None
        finally:
            self.sess.close()

    def get_followers(self, user_id):
        """Get followers of a user_id"""
        result = self.sess.query(Follower).filter(
            Follower.follower_id == user_id
        ).all()
        self.sess.close()
        return [f.user_id for f in result] if result else []

    def get_following(self, user_id):
        """Get users being followed by a user_id"""
        result = self.sess.query(Follower).filter(
            Follower.user_id == user_id
        ).all()
        self.sess.close()
        return [f.follower_id for f in result] if result else []

    # ----------------

    def get_id_of_type_memory(self, user_id):
        """Get memories of a user_id"""
        dict_memory = {
            'public': [],
            'liked': self.get_likes(user_id),
            'draft': [],
            'private': []
        }

        result = self.sess.query(Memory).filter(
            Memory.user_id == user_id
        ).all()
        for m in result:
            dict_memory[(m.type).lower()].append(m.id)

        self.sess.close()
        return dict_memory

    def convert_object_to_dict_user(self, user):
        """Convert user object to dictionary"""
        if user is None:
            return None

        return {
            'id': user.id,
            'fullname': user.fullname,
            'username': user.username,
            'email': user.email,
            'password': user.password,
            'confirmpass': user.confirmpass,
            'session_id': user.session_id,
            'reset_token': user.reset_token,
            'description': user.description,
            'dob': user.dob,
            "timecreated": user.timecreated,
            'image': user.image,
            'followingcount': user.followingcount,
            'followerscount': user.followerscount,
            'following': self.get_following(user.id),
            'followers': self.get_followers(user.id),
            'memories': self.get_id_of_type_memory(user.id),
            'my_comments': comment_module.get_all_comments_by_user_id(user.id)
        }
