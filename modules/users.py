from os import path
from json import dump, load
from werkzeug.security import generate_password_hash, check_password_hash


class Users():
    """Users class"""
    def __init__(self):
        self.filename = 'users.json'
        self.users = self.load_user_data()
        self.current_user = {}

    def check_if_file_exists(self):
        """check if file exists"""
        return path.exists(self.filename)

    def hash_password(self, password):
        """User passwords should NEVER be stored in plain text in a database."""
        return generate_password_hash(password)

    def is_valid(self, hashed_password, password):
        """is_valid function that expects 2 arguments and returns a boolean."""
        return check_password_hash(hashed_password, password)

    def load_user_data(self):
        """load user data from json file"""
        if self.check_if_file_exists() is True:
            with open(self.filename, 'r') as f:
                return load(f)
        else:
            return []
    
    def get_user_by_id(self, user_id):
        """get user by id function"""
        self.reload_users_data()
        for user in self.users:
            if user['id'] == int(user_id):
                return user

    def get_user_by_session_id(self, session_id):
        """get user by session id function"""
        self.reload_users_data()
        for user in self.users:
            if user['session_id'] == session_id:
                return user

    def save_user_data(self, data):
        """Save user data to a JSON file."""
        self.users.append(data)
        with open(self.filename, 'w') as f:
            dump(self.users, f, indent=4)
        f.close()

    def save_all_user_data(self):
        """Save user data to a JSON file."""
        with open(self.filename, 'w') as f:
            dump(self.users, f, indent=4)
        f.close()

    def check_user_if_exists(self, username, password):
        """check user if exists"""
        for user in self.users:
            if (user['email'] == username or user['username'] == username) and self.is_valid(user['password'], password):
                return user
        return False

    def reload_users_data(self):
        """Reload users data from the JSON file"""
        self.users = self.load_user_data()

    def search_about_users(self, query):
        """Search about users function"""
        self.reload_users_data()
        return [
            user for user in self.users if query.lower() in user['username'].lower()
        ]

    def update_user(self):
        """Update user function"""
        self.reload_users_data()
        for user in self.users:
            if user['id'] == self.current_user['id']:
                for key, value in self.current_user.items():
                    user[key] = value
                    self.save_all_user_data()
                return user
        else:
            return None

    def add_memory_id_to_user_data(self, memory_id, type_memory):
        """Add memory id to user data function"""
        self.reload_users_data()
        for user in self.users:
            if user['id'] == self.current_user['id']:
                if type_memory in ['public', 'draft', 'private']:
                    self.current_user['memories'][type_memory].append(memory_id)
                elif type_memory == 'liked':
                    if memory_id in self.current_user['memories'][type_memory]:
                        self.current_user['memories'][type_memory].remove(memory_id)
                    else:
                        self.current_user['memories'][type_memory].append(memory_id)
                self.update_user()
                return True
        return False

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
            'following': [],
            'followers': [],
            'memories': {
                'public': [],
                'liked': [],
                'draft': [],
                'private': []
            },
            'my_comments': []
        }

    def convert_tuple_to_dict_user(self, user_tuple):
        """Convert tuple to dict user function"""
        return {
            'id': user_tuple[0],
            'fullname': user_tuple[1],
            'username': user_tuple[2],
            'email': user_tuple[3],
            'dob': user_tuple[4],
            'password': user_tuple[5],
            'confirmpass': user_tuple[6],
            'session_id': user_tuple[7],
            'reset_token': user_tuple[8],
            'image': user_tuple[9],
            'description': user_tuple[10],
            'followingcount': user_tuple[11],
            'followerscount': user_tuple[12],
        }