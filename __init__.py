from flask import Flask, Blueprint, jsonify, render_template, request, redirect, url_for, session
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from functools import wraps
from sys import modules
from uuid import uuid4
from modules import *
import json
import os


users_module = Users()
memories_module = Memories()
comment_module = Comments_class()


app = Flask(__name__)

app.secret_key = 'pass@word#2044'


# Set session lifetime and Configure session to use secure cookies
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SECURE'] = True


@app.before_request
def make_session_permanent():
    session.permanent = True

def load_user(func):
    """Decorator to load the user from the session"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # session.clear()
        session_id = session.get('session_id')
        user = session.get('user')
        if user:
            users_module.current_user = user
        elif session_id:
            session_table = get_session()
            user = users_module.convert_object_to_dict_user(
                session_table.query(User).filter(
                    User.session_id == session_id
                ).first()
            )
            if user:
                current_user_id = user['id']

                # loading user followers and followings
                follow_list = session_table.query(Follower).filter(
                    or_(
                        Follower.user_id == current_user_id,
                        Follower.follower_id == current_user_id
                    )
                ).all()

                user['following'] = [
                    user.follower_id for user in follow_list if user.user_id == current_user_id
                ] or []
                user['followers'] = [
                    user.user_id for user in follow_list if user.follower_id == current_user_id
                ] or []

                # loading user's comments
                comments = session_table.query(Comment).filter(
                    Comment.user_id == current_user_id
                ).all()
                user['my_comments'] = comments or []

                # loading user's memories
                user['memories'] = {
                    "public": [],
                    "liked": [],
                    "draft": [],
                    "private": []
                }

                memories = session_table.query(Memory.id, Memory.type).filter(
                    Memory.user_id == current_user_id
                ).all()

                for memory in memories:
                    user['memories'][memory[1]].append(memory[0])

                # Set the user data back to session
                session['user'] = user
                users_module.current_user = user
            else:
                users_module.current_user = {}
                session['session_id'] = None
        else:
            users_module.current_user = {}
        return func(*args, **kwargs)
    return wrapper

def is_authentication():
    """Check if the user is authenticated"""
    current_user = session.get('user')
    if current_user:
        users_module.current_user = current_user
        return True
    else:
        return False

def save_current_user_data_in_session():
    """Save current user data in session"""
    session['user'] = users_module.current_user

def load_data_session_user():
    """Load user data from session"""
    if 'user' in session and not users_module.current_user:
        users_module.current_user = session['user']