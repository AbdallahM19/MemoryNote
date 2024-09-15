from sqlalchemy import create_engine, Column, Integer, String, Text, Enum, Table, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

username = "ethar"
password = "ethar2002"
host = "localhost"
database = "memory_db"

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    fullname = Column(String(150))
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    dob = Column(Text)
    timecreated = Column(Text)
    password = Column(String(255), nullable=False)
    confirmpass = Column(String(255), nullable=False)
    session_id = Column(String(255), nullable=False)
    reset_token = Column(String(255))
    image = Column(String(255))
    description = Column(Text)
    followingcount = Column(Integer, default=0)
    followerscount = Column(Integer, default=0)


class Follower(Base):
    __tablename__ = 'followers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    follower_id = Column(Integer)


class Memory(Base):
    __tablename__ = 'memories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String(255))
    timestamp = Column(Text)
    description = Column(Text)
    image = Column(Text)
    share = Column(Enum('Just Me', 'Friends', 'Everyone'))
    type = Column(Enum('Public', 'Liked', 'Draft', 'Private'))
    calendar = Column(Text)
    likes = Column(Integer, default=0)


class Comment(Base):
    __tablename__ = 'comments'

    comment_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    memory_id = Column(Integer, nullable=False)
    comment = Column(Text)
    timestamp = Column(Text)


class LikeList(Base):
    __tablename__ = 'likelist'

    id = Column(Integer, primary_key=True, autoincrement=True)
    memory_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)


def create_engine_and_connect():
    """Creates the engine and connects to the database."""
    return create_engine(
        'mysql+mysqlconnector://{}:{}@{}/{}'.format(
            username, password, host, database
        )
    )

def create_database():
    """Creates the database schema."""
    engine = create_engine(
        'mysql+mysqlconnector://{}:{}@{}/'.format(
            username, password, host
    ))
    with engine.connect() as connection:
        connection.execute(text("CREATE DATABASE IF NOT EXISTS {}".format(database)))
    print("Database 'memory_db' created or already exists.")

def create_tables():
    engine = create_engine_and_connect()
    Base.metadata.create_all(engine)
    print("Tables created or already exist.")

def get_session():
    """Return a new session."""
    engine = create_engine_and_connect()
    Session = sessionmaker(bind=engine)
    return Session()