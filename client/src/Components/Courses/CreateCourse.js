import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Context from '../../Context';

const CreateCourse = () => {
  const context = useContext(Context.Context);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState('');
  const [errors, setErrors] = useState([]);
  const authUser = context.authenticatedUser;
  let navigate = useNavigate();

  // 🔒 Check if user is a student
  if (authUser && authUser.role === 'student') {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>❌ Access Denied</h2>
          <p>Only teachers can create courses.</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  const onChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;

    if (name === 'courseTitle') {
      setCourseTitle(value);
    }
    if (name === 'courseDescription') {
      setCourseDescription(value);
    }
    if (name === 'estimatedTime') {
      setEstimatedTime(value);
    }
    if (name === 'materialsNeeded') {
      setMaterialsNeeded(value);
    }
  };

  const submit = (event) => {
    event.preventDefault();

    // Course object to create a course
    const course = {
      title: courseTitle,
      description: courseDescription,
      estimatedTime,
      materialsNeeded,
      userId: authUser.id,
    };

    context.data
      .createCourse(course)
      .then((errors) => {
        if (errors.length) {
          setErrors(errors);
        } else {
          navigate('/');
        }
      })
      .catch((error) => {
        console.error(error);
        navigate('/error');
      });
  };

  const cancel = (event) => {
    event.preventDefault();
    navigate('/');
  };

  return (
    <div className="form">
      <h1>Create Course</h1>

      {/* Display error messages */}
      {errors.length > 0 && (
        <div className="validation-errors">
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}

      <form onSubmit={submit}>
        <div>
          <label htmlFor="courseTitle">Course Title</label>
          <input
            id="courseTitle"
            name="courseTitle"
            type="text"
            value={courseTitle}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="courseDescription">Course Description</label>
          <textarea
            id="courseDescription"
            name="courseDescription"
            value={courseDescription}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="estimatedTime">Estimated Time</label>
          <input
            id="estimatedTime"
            name="estimatedTime"
            type="text"
            value={estimatedTime}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="materialsNeeded">Materials Needed</label>
          <textarea
            id="materialsNeeded"
            name="materialsNeeded"
            value={materialsNeeded}
            onChange={onChange}
            required
          />
        </div>

        <button className="button" type="submit">
          Create
        </button>
        <button className="button button-secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;
