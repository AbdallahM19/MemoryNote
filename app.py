from __init__ import *


# ----------------------------------------------------------------
# Api users, Memories
# ----------------------------------------------------------------

users_bp = Blueprint('user', __name__)
memories_bp = Blueprint('memory', __name__)


@users_bp.route('/users', methods=['GET'])
@users_bp.route('/users/', methods=['GET'])
@users_bp.route('/users/<int:user_id>', methods=['GET'])
@users_bp.route('/users/<int:user_id>/', methods=['GET'])
def get_users(user_id=None):
    """get all users data"""
    user_session = get_session()
    if user_id:
        if user_id == users_module.current_user['id']:
            user_session.close()
            return jsonify(users_module.current_user)
        user = user_session.query(User).filter(
            User.id == user_id
        ).first()
        if user:
            user_dict = users_module.convert_object_to_dict_user(user)
            user_session.close()
            return jsonify(user_dict)
        else:
            user_session.close()
            return jsonify({'error': 'User not found'}), 404
    users_list = []
    users = user_session.query(User).all()
    for user in users:
        user_dict = users_module.convert_object_to_dict_user(user)
        users_list.append(user_dict)
    user_session.close()
    return jsonify(users_list)


@users_bp.route('/current-user', methods=['GET'])
@users_bp.route('/current-user/', methods=['GET'])
@users_bp.route('/profile', methods=['GET', 'PUT'])
@users_bp.route('/profile/', methods=['GET', 'PUT'])
def get_profile():
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
        user_session = get_session()
        current_user = user_session.query(User).filter(
            User.id == users_module.current_user['id']
        ).first()
        if current_user:
            for field in fields:
                setattr(current_user, field, users_module.current_user[field])
            user_session.commit()
            user_session.close()
            return jsonify(users_module.current_user), 200
        return jsonify({'error': 'User not found'}), 404


@users_bp.route('/users/like/<int:memory_id>', methods=['POST'])
def add_or_minus_like(memory_id):
    """Add or minus like"""
    if not users_module.current_user:
        load_data_session_user()
    # print(users_module.current_user)
    # print(session.get('user'))
    # print(session.get('user') == users_module.current_user)
    # print(session.get('session_id'))
    user_id = users_module.current_user['id']
    try:
        session_table = get_session()
        if memory_id in users_module.current_user['memories']['liked']:
            users_module.current_user['memories']['liked'].remove(memory_id)
            session_table.query(Memory).filter(
                Memory.id == memory_id
            ).first().likes -= 1
            session_table.delete(
                session_table.query(LikeList).filter(
                    and_(
                        LikeList.memory_id == memory_id,
                        LikeList.user_id == user_id
                    )
                ).first()
            )
        else:
            users_module.current_user['memories']['liked'].append(memory_id)
            session_table.query(Memory).filter(
                Memory.id == memory_id
            ).first().likes += 1
            session_table.add(
                LikeList(
                    memory_id=memory_id,
                    user_id=user_id
                )
            )
        session_table.commit()
        session_table.close()
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
    user_session = get_session()
    user = user_session.query(User).filter(
        User.id == users_module.current_user['id']
    ).first()
    if user:
        user.fullname = users_module.current_user['fullname'] = data['fullname']
        user.description = users_module.current_user['description'] = data['userbio']
        user.username = users_module.current_user['username'] = data['username']
        save_current_user_data_in_session()
        user_session.commit()
        user_session.close()
        return jsonify({'message': 'Updated Successful'})
    else:
        return jsonify({'error': 'User not found'}), 404


@memories_bp.route('/memories', methods=['GET'])
@memories_bp.route('/memories/', methods=['GET'])
@memories_bp.route('/memories/<int:memory_id>', methods=['GET'])
@memories_bp.route('/memories/<int:memory_id>/', methods=['GET'])
def get_memories(memory_id=None):
    """get all memories data"""
    memory_session = get_session()
    if memory_id:
        memory = memory_session.query(Memory).filter(Memory.id == memory_id).first()
        if memory:
            memory_dict = memories_module.convert_object_to_dict_memory(memory)
            return jsonify(memory_dict)
        else:
            return jsonify({"error": "memory not found"}), 404
    memory_list = []
    memories = memory_session.query(Memory).all()
    for memory in memories:
        memory_dict = memories_module.convert_object_to_dict_memory(memory)
        memory_list.append(memory_dict)
    return jsonify(memory_list)


@memories_bp.route('/get-memories', methods=['GET'])
def get_user_memories():
    """Get memories"""
    memory_list = []
    memory_session = get_session()
    memories = memory_session.query(Memory).filter(
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
    # print(memories_sorted)
    return jsonify(memories_sorted)

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
        user_session = get_session()
        user_session.query(User).filter(
            User.id == user_id
        ).first().image = image_url
        user_session.commit()
        user_session.close()

        return jsonify({'imageUrl': image_url})
    else:
        return jsonify({'error': 'Invalid request method'}), 400


# ----------------------------------------------------------------
# Main Routes
# ----------------------------------------------------------------


@app.route('/', methods=['GET', 'POST', 'DELETE'])
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
        memory_session = get_session()
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
        memory_session.add(new_memory)
        memory_session.commit()
        memory_session.close()
        return jsonify({'message': 'True'})
    elif request.method == 'DELETE':
        return jsonify({'message': 'Home Page - DELETE'})
    else:
        return jsonify({'error': 'Method not allowed'}), 405


@app.route('/search', methods=['GET'])
@load_user
def search_page():
    """Home"""
    if is_authentication() is False:
        return redirect(url_for('login'))
    if request.method == 'GET':
        query = request.args.get('query')
        if query:
            memories_list = []
            users_list = []
            session_table = get_session()

            memories = session_table.query(Memory).filter(
                Memory.title.like('%{}%'.format(query))
            ).all()

            for memory in memories:
                i = memories_module.convert_object_to_dict_memory(memory)
                memories_list.append(i)

            users = session_table.query(User).filter(
                User.username.like('%{}%'.format(query))
            ).all()

            for user in users:
                i = users_module.convert_object_to_dict_user(user)
                users_list.append(i)

            session_table.close()
            return render_template('search.html', memories=memories_list, users=users_list)
        return render_template('search.html')
    else:
        return jsonify({'error': 'Method not allowed'}), 405


@app.route('/profile-user', methods=['GET', 'POST'])
@app.route('/profile-user/', methods=['GET', 'POST'])
@load_user
def profile_page():
    """Profile Page"""
    if is_authentication() is False:
        return redirect(url_for('login'))
    if request.method == 'GET':
        return render_template('profile_page.html')
    else:
        return jsonify({'error': 'Method not allowed'}), 405


@app.route('/login/', methods=['GET', 'POST'])
@load_user
def login():
    """login page"""
    if is_authentication():
        return redirect(url_for('home_page'))
    if request.method == 'GET':
        return render_template('login.html')
    try:
        data = request.get_json()
        # user_data = mysql_db.check_user_if_exists(
        #     data['username'], data['password']
        # )
        # user_data = users_module.convert_tuple_to_dict_user(
        #     user_data
        # )
        user_session = get_session()
        user_data = users_module.convert_object_to_dict_user(
            user_session.query(User).filter(
                or_(
                    User.username == data['username'],
                    User.email == data['username']
                )
            ).first()
        )
        user_session.close()
        if user_data and type(user_data) == dict and (
            users_module.is_valid(user_data['password'], data['password']) or
            user_data['confirmpass'] == data['password']
        ):
            users_module.current_user = user_data
            session['session_id'] = user_data['session_id']
            session['user'] = user_data
            return jsonify({'message': 'Login successful'})
        else:
            return jsonify({'message': 'email not found'}), 401
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/register/', methods=['GET', 'POST'])
@load_user
def register():
    """register"""
    if is_authentication():
        return redirect(url_for('home_page'))
    if request.method == 'GET':
        return render_template('register.html')
    try:
        data = request.get_json()

        session_table = get_session()
        user = session_table.query(User).filter(
            or_(
                User.username == data['username'],
                User.email == data['email']
            )
        ).first()

        if user:
            if user.username:
                return jsonify({'message': 'username already exists'}), 400
            if user.email:
                return jsonify({'message': 'email already exists'}), 400

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
        session_table.add(new_user)

        session_table.commit()

        user_id = new_user.id
        new_user_data['id'] = user_id
        users_module.current_user = new_user_data
        session['session_id'] = new_user_data['session_id']
        session['user'] = new_user_data

        session_table.close()

        return jsonify({'message': 'Register successful'})
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


def main():
    """main function"""
    # print(name(name='ali'))
    # print(dir())
    # print(__name__)
    # session['session_id'] = '0000'
    # mysql_db.create_database()
    create_database()
    create_tables()
    app.run(host="127.0.0.1", port=5000, debug=True)
    # print(datetime.now())
    # print(datetime.now().strftime("%H:%M:%S %a %d:%m:%Y"))
    # for i in dir():
    # for i in locals():
    # for i in globals():
    # for i in vars(object):
        # print(i)

if __name__ == "__main__":
    main()