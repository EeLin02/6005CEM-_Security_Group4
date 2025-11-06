import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Context from '../../Context';
import Loading from '../Loading';

const Courses = () => {
  const context = useContext(Context.Context);
  const authUser = context.authenticatedUser;
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    context.data.getCourses()
      .then((response) => setData(response))
      .catch((error) => {
        console.error('Error fetching and parsing data', error);
        navigate('/error');
      })
      .finally(() => setIsLoading(false));
  }, [navigate, context.data]);

  // Handle click when user isn't logged in
  const handleCourseClick = (e) => {
    if (!authUser) {
      e.preventDefault(); // stop navigation
      setShowPopup(true);
    }
  };

  return (
    isLoading ? (
      <Loading />
    ) : (
      <div className="wrap main--grid">
        {/* 🔹 List of courses */}
        {data.length > 0 ? (
          data.map((course) => (
            <Link
              to={`/courses/${course.id}`}
              className="course--module course--link"
              key={course.id}
              onClick={handleCourseClick}
            >
              <h2 className="course--label">Course</h2>
              <h3 className="course--title">{course.title}</h3>
            </Link>
          ))
        ) : (
          <p>No courses found.</p>
        )}

        {/* 🔹 New Course tile */}
        <Link
          to={authUser ? '/courses/create' : '#'}
          className="course--module course--add--module"
          onClick={(e) => {
            if (!authUser) {
              e.preventDefault();
              setShowPopup(true);
            }
          }}
        >
          <span className="course--add--title">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 13 13"
              className="add"
            >
              <polygon points="7,6 7,0 6,0 6,6 0,6 0,7 6,7 6,13 7,13 7,7 13,7 13,6"></polygon>
            </svg>
            New Course
          </span>
        </Link>

        {/* 🔒 Popup Modal */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <button
                className="popup-close"
                onClick={() => setShowPopup(false)}
              >
                ×
              </button>
              <h2>Sign In Required</h2>
              <p>You must be signed in to view course details.</p>
              <button
                className="button"
                onClick={() => navigate('/signin')}
              >
                Go to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default Courses;