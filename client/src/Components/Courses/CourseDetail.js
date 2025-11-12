import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import Context from '../../Context';
import Loading from '../Loading';

const CourseDetail = () => {
  const context = useContext(Context.Context);
  const [course, setCourse] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const authUser = context.authenticatedUser;

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    context.data
      .getCourse(id)
      .then((response) => {
        if (response?.id) {
          setCourse(response);
        } else {
          navigate('/notfound');
        }
      })
      .catch((error) => {
        console.error('Error fetching and parsing course', error);
        navigate('/error');
      })
      .finally(() => setIsLoading(false));

    return () => controller?.abort();
  }, [id, navigate, context.data]);

  const handleDelete = (event) => {
    event.preventDefault();
    context.data
      .deleteCourse(id)
      .then((response) => {
        if (response?.length) {
          navigate('/error');
        } else {
          navigate('/');
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/error');
      });
  };

  const content = course?.id ? (
    <div className="wrap">
      <h2>Course Detail</h2>
      <div className="main--flex">
        <div>
          <h3 className="course--detail--title">Course</h3>
          <h4 className="course--name">{course.title}</h4>

          {course.User ? (
            <p>
              By {course.User.firstName} {course.User.lastName}
            </p>
          ) : null}

          {/* 🔒 Sanitize markdown output to prevent XSS */}
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {course.description || ''}
          </ReactMarkdown>
        </div>

        <div>
          <h3 className="course--detail--title">Estimated Time</h3>
          <p>{course.estimatedTime}</p>

          <h3 className="course--detail--title">Materials Needed</h3>
          <ul className="course--detail--list">
            {/* 同样对 materialsNeeded 做 sanitize */}
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {course.materialsNeeded || ''}
            </ReactMarkdown>
          </ul>
        </div>
      </div>
    </div>
  ) : null;

  return isLoading ? (
    <Loading />
  ) : course ? (
    <div>
      <div className="actions--bar">
        <div className="wrap">
          {authUser && course.User && authUser.id === course.User.id ? (
            <Link to={`/courses/${id}/update`} className="button">
              Update Course
            </Link>
          ) : null}

          {authUser && course.User && authUser.id === course.User.id ? (
            <button className="button" onClick={handleDelete}>
              Delete Course
            </button>
          ) : null}

          <Link to="/" className="button button-secondary">
            Return to List
          </Link>
        </div>
      </div>
      {content}
    </div>
  ) : null;
};

export default CourseDetail;
