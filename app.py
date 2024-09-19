from __init__ import *


# ----------------------------------------------------------------
# Api users, Memories
# ----------------------------------------------------------------

users_bp = Blueprint('user', __name__)
memories_bp = Blueprint('memory', __name__)
comments_bp = Blueprint('comment', __name__)


session_db = get_session()


# -----------------------------------------------
# -{Api users}-----------------------------------
# -----------------------------------------------

@users_bp.route('/users', methods=['GET'])
@users_bp.route('/users/', methods=['GET'])
@users_bp.route('/users/<int:user_id>', methods=['GET'])
@users_bp.route('/users/<int:user_id>/', methods=['GET'])
def get_users(user_id=None):
    """get all users data"""
    if not users_module.current_user:
        load_data_session_user()

    if user_id:
        if user_id == users_module.current_user['id']:
            return jsonify(users_module.current_user)
        user = users_module.get_user_by_id(user_id)
        if user:
            user_dict = users_module.convert_object_to_dict_user(user)
            return jsonify(user_dict)
        else:
            return jsonify({'error': 'User not found'}), 404
    users_list = []
    users = users_module.get_all_users()
    for user in users:
        user_dict = users_module.convert_object_to_dict_user(user)
        users_list.append(user_dict)
    return jsonify(users_list)


@users_bp.route('/current-user', methods=['GET'])
@users_bp.route('/current-user/', methods=['GET'])
@users_bp.route('/profile', methods=['GET', 'PUT'])
@users_bp.route('/profile/', methods=['GET', 'PUT'])
def get_profile():
    """get current user data or update current user data"""
    if request.method == 'GET':
        return jsonify(users_module.current_user), 200
    elif request.method == 'PUT':
        data = request.get_json()
        fields = ["fullname", "username", "email", "image"]
        for field in fields:
            if data.get(field) is not None and data[field] != "":
                users_module.current_user[field] = data[field]

        password = data.get("password")
        if password:
            users_module.current_user["password"] = users_module.hash_password(password)
            users_module.current_user["confirmpass"] = password
        save_current_user_data_in_session()
        users_module.update_current_user_in_table_user()
        return jsonify(users_module.current_user), 200


@users_bp.route('/users/like/<int:memory_id>', methods=['POST'])
def add_or_minus_like(memory_id):
    """Add or minus like"""
    if not users_module.current_user:
        load_data_session_user()

    try:
        if memory_id in users_module.current_user['memories']['liked']:
            users_module.delete_like(memory_id)
        else:
            users_module.add_like(memory_id)
        save_current_user_data_in_session()
        return jsonify({
            'message': True
            # if memory_id in users_module.current_user['memories']['liked'] else False
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@users_bp.route('/profile-update', methods=['POST'])
def update_profile():
    """Update profile"""
    data = request.get_json()
    users_module.current_user['fullname'] = data['fullname']
    users_module.current_user['description'] = data['userbio']
    users_module.current_user['username'] = data['username']
    save_current_user_data_in_session()
    users_module.update_current_user_in_table_user()
    return jsonify({'message': 'Updated Successful'})


@users_bp.route('/follow/<int:user_id>', methods=['GET', 'POST'])
def follow_user(user_id):
    if not users_module.current_user:
        load_data_session_user()

    if request.method == 'GET':
        return jsonify({"is_following": bool(
            users_module.get_follow_or_following(
                user_id
            )
        )}), 200

    elif request.method == 'POST':
        user_to_follow = users_module.get_follow_or_following(user_id)
        if user_to_follow:
            session_db.delete(user_to_follow)

            session_db.query(User).filter(
                User.id == users_module.current_user['id']
            ).first().followingcount -= 1

            session_db.query(User).filter(
                User.id == user_id
            ).first().followerscount -= 1

            users_module.current_user['followingcount'] -= 1
            users_module.current_user['following'].remove(user_id)

            session_db.commit()
            session_db.close()

            save_current_user_data_in_session()
            print(users_module.current_user['following'])
            print(users_module.current_user['followers'])
            return jsonify({"message": "Unfollow", "is_following": False}), 200
        else:
            new_follower = Follower(
                user_id=users_module.current_user['id'],
                follower_id=user_id
            )
            session_db.add(new_follower)

            session_db.query(User).filter(
                User.id == users_module.current_user['id']
            ).first().followingcount += 1

            session_db.query(User).filter(
                User.id == user_id
            ).first().followerscount += 1

            users_module.current_user['followingcount'] += 1
            users_module.current_user['following'].append(user_id)

            session_db.commit()
            session_db.close()

            save_current_user_data_in_session()
            return jsonify({"message": "Follow", "is_following": True}), 200

# --------------------------------------------------
# -{Api memories}-----------------------------------
# --------------------------------------------------

@memories_bp.route('/memories', methods=['GET'])
@memories_bp.route('/memories/', methods=['GET'])
@memories_bp.route('/memories/<int:memory_id>', methods=['GET'])
@memories_bp.route('/memories/<int:memory_id>/', methods=['GET'])
def get_memories(memory_id=None):
    """get all memories data"""
    if memory_id:
        memory = memories_module.get_memories_by_id(memory_id)
        if memory:
            return jsonify(
                memories_module.convert_object_to_dict_memory(memory)
            )
        else:
            return jsonify({"error": "memory not found"}), 404

    memories = memories_module.get_memories()
    return jsonify([
        memories_module.convert_object_to_dict_memory(memory)
        for memory in memories
    ])


@memories_bp.route('/query', methods=['GET'])
def get_query_like_memories():
    """get all memories data that match the query"""
    query = request.args.get('query')
    if query:
        memories = memories_module.get_memories_for_search(
            query, users_module.current_user['id']
        )

        users = users_module.get_users_for_search(query)

        return jsonify({
            "memories": memories,
            "users": users
        })
    return jsonify({"error": "query not found"}), 404


@memories_bp.route('/memory/user/<int:user_id>', methods=['GET'])
def get_memories_user(user_id):
    """get all memories of a user"""
    memories = memories_module.get_memories_for_user(user_id)
    if user_id:
        memories_list = [
            memories_module.convert_object_to_dict_memory(memory)
            for memory in memories
        ]
        memories_sorted = sorted(
            memories_list,
            key=lambda x: datetime.strptime(x['timestamp'], '%a %b %d %H:%M:%S %Y'),
            reverse=True
        )
        return jsonify(memories_sorted)
    return jsonify({"message": "user not found"})


@memories_bp.route('/get-memories', methods=['GET'])
def get_user_memories():
    """Get memories"""
    memory_list = []
    memories = session_db.query(Memory).filter(
        or_(
            Memory.user_id == users_module.current_user["id"],
            Memory.type == 'Public'
        )
    ).all()
    for memory in memories:
        memory_dict = memories_module.convert_object_to_dict_memory(memory)
        memory_list.append(memory_dict)
    memories_sorted = sorted(
        memory_list,
        key=lambda x: datetime.strptime(x['timestamp'], '%a %b %d %H:%M:%S %Y'),
        reverse=True
    )
    session_db.close()
    # print(memories_sorted)
    return jsonify(memories_sorted)


@memories_bp.route('/edit-memory/<int:memory_id>', methods=['PUT', 'DELETE'])
def edit_memory(memory_id):
    """Edit memory"""
    if request.method == 'PUT':
        data = request.get_json()
        memory_new_data = {
            "title": data.get("title"),
            "description": data.get("description"),
            "type": data.get("type"),
            "share": data.get("share"),
            "timestamp": datetime.now().strftime("%a %b %d %H:%M:%S %Y"),
            "image": ",".join(data.get("image")) if data.get("image") else "",
        }
        is_success = memories_module.update_memory(
            memory_id, memory_new_data
        )
        if is_success:
            return jsonify({"message": "memory updated"})
        return jsonify({"message": "memory not found"})
    elif request.method == 'DELETE':
        is_success = memories_module.delete_memory(memory_id)
        if is_success:
            for key, value in users_module.current_user['memories'].items():
                if memory_id in value:
                    users_module.current_user['memories'][key].remove(memory_id)
            save_current_user_data_in_session()
            return jsonify({"message": "memory deleted"})
        return jsonify({"message": "memory not found"})

# ---------------------------------------------------
# -{Api commments}-----------------------------------
# ---------------------------------------------------

@comments_bp.route('/comments/<int:user_id>', methods=['GET'])
def get_comments_by_user_id(user_id):
    """Retrieve all comments by user_id."""
    comments = comment_module.get_all_comments_by_user_id(user_id)
    return jsonify(comments), 200

@comments_bp.route('/comments/memory/<int:memory_id>', methods=['GET'])
def get_comments_by_memory_id(memory_id):
    """Retrieve all comments for a memory_id."""
    comments = comment_module.get_all_comments_by_memory_id(memory_id)
    return jsonify(comments), 200

@comments_bp.route('/comments/memory/<int:memory_id>', methods=['POST'])
def create_comment(memory_id):
    """Create a new comment."""
    data = request.get_json()

    comment_text = data.get('comment')
    user_id = users_module.current_user['id']

    if not comment_text or not memory_id or not user_id:
        return jsonify({"error": "Missing required fields"}), 400
    
    new_comment = comment_module.insert_comment(comment_text, memory_id, user_id)
    return jsonify(new_comment), 201

@comments_bp.route('/comments/<int:comment_id>', methods=['PUT'])
def update_comment(comment_id):
    """Edit an existing comment."""
    data = request.get_json()
    data['comment_id'] = comment_id
    comment_module.update_comment(data)
    return jsonify({"message": "Comment updated"}), 200

@comments_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    """Delete a comment."""
    success = comment_module.delete_comment(comment_id)
    if success:
        return jsonify({"message": "Comment deleted"}), 200
    else:
        return jsonify({"error": "Comment not found or deletion failed"}), 400


# ----------------------------------------------------------------
# Image Routes
# ----------------------------------------------------------------

app.config['UPLOAD_FOLDER'] = 'static/uploads/'
# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


@app.route('/upload-images', methods=['POST', 'PUT'])
def upload_images():
    """Upload images"""
    if request.method == 'POST':
        if 'images' not in request.files:
            return jsonify({'error': 'No files uploaded'}), 400

        files = request.files.getlist('images')
        image_paths = []

        for file in files:
            filename = secure_filename(file.filename)
            path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(path)
            image_url = os.path.join('/static/uploads/', filename)
            image_paths.append(image_url)

        return jsonify({'imagePaths': image_paths})
    elif request.method == 'PUT':
        user_id = int(request.form.get('id'))

        if 'image' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        filename = secure_filename(file.filename)
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)
        image_url = os.path.join('/static/uploads/', filename)

        # update image user in session
        session['user']['image'] = image_url

        # update current user image profile
        session_db.query(User).filter(
            User.id == user_id
        ).first().image = image_url
        session_db.commit()
        session_db.close()

        return jsonify({'imageUrl': image_url})
    else:
        return jsonify({'error': 'Invalid request method'}), 400


# ----------------------------------------------------------------
# Main Routes
# ----------------------------------------------------------------


@app.route('/landing-page', methods=['GET'])
def landing_page():
    """Landing page route"""
    return render_template('landing_page.html')


@app.route('/web-page', methods=['GET'])
def web_page():
    """Web page route"""
    return render_template('MemoryNotewebpage.html')


@app.route('/', methods=['GET', 'POST', 'DELETE'])
@app.route('/home', methods=['GET', 'POST', 'DELETE'])
@app.route('/home/', methods=['GET', 'POST', 'DELETE'])
@load_user
def home_page():
    """Home"""
    if is_authentication() is False:
        return redirect(url_for('login'))
    if request.method == 'GET':
        return render_template(
            'home.html',
            image=users_module.current_user['image']
        )
    elif request.method == 'POST':
        data = request.get_json()
        new_memory_data = {
            "user_id": users_module.current_user['id'],
            "title": data['title'] if data['title'] else datetime.now().strftime("%a %H:%M:%S %d:%m:%Y"),
            "timestamp": datetime.now().strftime("%a %b %d %H:%M:%S %Y"),
            "image": data['image'],
            "description": data['content'],
            "share": data['share'],
            "type": data['status'],
            "calendar": data['calendar'],
            "liked": 0,
            "likelist": [],
            "file": [],
            "comments": [
                {
                    "comment_id": "",
                    "user_id": 0,
                    "comment": "",
                    "timestamp": ""
                }
            ]
        }
        memories_module.create_new_memory(new_memory_data)
        return jsonify({'message': 'True'})
    elif request.method == 'DELETE':
        return jsonify({'message': 'Home Page - DELETE'})
    else:
        return jsonify({'error': 'Method not allowed'}), 405


# @app.route('/search', methods=['GET'])
# @load_user
# def search_page():
#     """Home"""
#     if is_authentication() is False:
#         return redirect(url_for('login'))
#     if request.method == 'GET':
#         query = request.args.get('query')
#         if query:
#             memories_list = []
#             users_list = []
#             session_table = get_session()

#             memories = session_table.query(Memory).filter(
#                 Memory.title.like('%{}%'.format(query))
#             ).all()

#             for memory in memories:
#                 i = memories_module.convert_object_to_dict_memory(memory)
#                 memories_list.append(i)

#             users = session_table.query(User).filter(
#                 User.username.like('%{}%'.format(query))
#             ).all()

#             for user in users:
#                 i = users_module.convert_object_to_dict_user(user)
#                 users_list.append(i)

#             session_table.close()
#             return render_template('search.html', memories=memories_list, users=users_list)
#         return render_template('search.html')
#     else:
#         return jsonify({'error': 'Method not allowed'}), 405

@app.route('/search', methods=['GET'])
@load_user
def search_page():
    """Home"""
    if is_authentication() is False:
        return redirect(url_for('login'))

    if request.method == 'GET':
        return render_template('search.html')
    else:
        return jsonify({'error': 'Method not allowed'}), 405


@app.route('/profile-user', methods=['GET', 'POST'])
@app.route('/profile-user/<int:user_id>', methods=['GET', 'POST'])
@load_user
def profile_page(user_id=None):
    """Profile Page"""
    if is_authentication() is False:
        return redirect(url_for('login'))
    if request.method == 'GET':
        return render_template('profile_page.html')
    else:
        return jsonify({'error': 'Method not allowed'}), 405


@app.route('/login', methods=['GET', 'POST'])
@load_user
def login():
    """login page"""
    if is_authentication():
        return redirect(url_for('home_page'))
    if request.method == 'GET':
        return render_template('login.html')
    try:
        data = request.get_json()
        user_data = users_module.authenticate_user(
            data['username'], data['password']
        )
        if user_data and type(user_data) == dict:
            session['user'] = user_data
            session['session_id'] = user_data['session_id']
            return jsonify({'message': 'Login successful'})
        else:
            return jsonify({'message': 'email not found'}), 401
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/register', methods=['GET', 'POST'])
@load_user
def register():
    """register"""
    if is_authentication():
        return redirect(url_for('home_page'))
    if request.method == 'GET':
        return render_template('register.html')
    try:
        data = request.get_json()

        existing_user = session_db.query(User).filter(
            or_(
                User.username == data['username'],
                User.email == data['email']
            )
        ).first()

        if existing_user:
            if existing_user.username == data['username']:
                return {'message': 'username already exists'}, 400
            if existing_user.email == data['email']:
                return {'message': 'email already exists'}, 400

        new_user_data = {
            "fullname": data['fullname'],
            "username": data['username'],
            "email": data['email'],
            "dob": data['dob'],
            "timecreated": datetime.now().strftime("%a %b %d %H:%M:%S %Y"),
            "password": users_module.hash_password(data['password']),
            "confirmpass": data['confirmpass'],
            "description": "",
            "session_id": str(uuid4()),
            "reset_token": "",
            "image": "",
            "following": [],
            "followingcount": 0,
            "followers": [],
            "followerscount": 0,
            "memories": {
                "public": [],
                "liked": [],
                "draft": [],
                "private": []
            },
            "my_comments": []
        }

        new_user = User(
            fullname=new_user_data['fullname'],
            username=new_user_data['username'],
            email=new_user_data['email'],
            dob=new_user_data['dob'],
            timecreated=new_user_data['timecreated'],
            password=users_module.hash_password(new_user_data['password']),
            confirmpass=new_user_data['confirmpass'],
            description=new_user_data['description'],
            session_id=new_user_data['session_id'],
            reset_token=new_user_data['reset_token'],
            image=new_user_data['image'],
            followingcount=new_user_data['followingcount'],
            followerscount=new_user_data['followerscount'],
        )
        session_db.add(new_user)
        session_db.commit()

        user_id = new_user.id
        new_user_data['id'] = user_id
        users_module.current_user = new_user_data
        session['session_id'] = new_user_data['session_id']
        session['user'] = new_user_data

        session_db.close()
        return jsonify({'message': 'Register successful'}), 201
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/logout')
@load_user
def  logout():
    """logout"""
    users_module.current_user = {}
    session.clear()
    return redirect(url_for('login'))


# @app.errorhandler(Exception)
# def error(e):
#     """error handler"""
#     error_code = 500
#     error_message = "Internal Server Error"
#     if hasattr(e, 'code'):
#         error_code = e.code
#         error_message = e.name
#     return render_template('error.html', error_code=error_code, error_message=error_message), error_code


# Register blueprints after defining all routes
app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(memories_bp, url_prefix='/api')
app.register_blueprint(comments_bp, url_prefix='/api')


def main():
    """main function"""
    # print(name(name='ali'))
    # print(dir())
    # print(__name__)
    # session['session_id'] = '0000'
    # mysql_db.create_database()
    # ----------------------------------------------------
    # create_database()
    # create_tables()
    app.run(host="127.0.0.1", port=5000, debug=True)
    session_db.close()
    users_module.sess.close()
    memories_module.sess.close()
    # ----------------------------------------------------
    # print(datetime.now())
    # print(datetime.now().strftime("%H:%M:%S %a %d:%m:%Y"))
    # for i in dir():
    # for i in locals():
    # for i in globals():
    # for i in vars(object):
        # print(i)

if __name__ == "__main__":
    main()
