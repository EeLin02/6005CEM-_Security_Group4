import config from './config';

export default class Data {
  /**
   * Centralized API request handler
   * @param {string} path - API endpoint path
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} body - Request body (optional)
   * @param {boolean} requiresAuth - Whether Basic Auth is needed
   * @param {object} credentials - Username/password for Basic Auth
   * @returns {Promise} Fetch response
   */

    api(path, method = 'GET', body = null, requiresAuth = false, credentials = null) {
    const url = config.apiBaseUrl + path;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Always include for HttpOnly cookies
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    if (requiresAuth && credentials) {
      const encodedCredentials = btoa(`${credentials.username}:${credentials.password}`);
      options.headers['Authorization'] = `Basic ${encodedCredentials}`;
    }

    return fetch(url, options);
  }

  async getUser(username, password) {
    const encodedCredentials = btoa(`${username}:${password}`);
    const response = await fetch(config.apiBaseUrl + '/users', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Include cookies for future requests
    });

    if (response.status === 200) {
      return response.json().then(data => data);
    } else if (response.status === 401) {
      return response.json().then(message => message);
    } else {
      throw new Error();
    }
  }

  /**
   * Sign in user with Basic Auth
   */
  async signIn(emailAddress, password) {
    const encodedCredentials = btoa(`${emailAddress}:${password}`);
    const response = await fetch(config.apiBaseUrl + '/users', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Accept HttpOnly cookies
    });

    if (response.status === 200) {
      return response.json();
    } else if (response.status === 402) {
      const error = new Error();
      error.response = response;
      throw error;
    } else if (response.status === 401 || response.status === 403) {
      const errorData = await response.json();
      return errorData;
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  }

  /**
   * Create a new user in the database
   */
  async createUser(user) {
    const response = await fetch(config.apiBaseUrl + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(user),
      credentials: 'include',
    });

    if (response.status === 201) {
      return response.json();
    } else if (response.status === 400) {
      return response.json().then(data => data.errors);
    } else {
      throw new Error();
    }
  }

  /**
   * Get all available courses
   */
  async getCourses() {
    const response = await fetch(config.apiBaseUrl + '/courses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Include HttpOnly JWT cookie
    });

    if (response.status === 200) {
      return response.json().then(data => data);
    } else {
      throw new Error();
    }
  }

  /**
   * Get a specific course by id
   */
  async getCourse(id) {
    const response = await fetch(config.apiBaseUrl + `/courses/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Include HttpOnly JWT cookie
    });

    if (response.status === 200) {
      return response.json().then(data => data);
    } else {
      throw new Error();
    }
  }

  /**
   * ✅ Create a new course with JWT (from HttpOnly cookie)
   */
  async createCourse(course) {
    const response = await fetch(config.apiBaseUrl + '/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // JWT sent automatically in HttpOnly cookie
      },
      body: JSON.stringify(course),
      credentials: 'include', // ✅ Send HttpOnly JWT cookie
    });

    if (response.status === 201) {
      return [];
    } else if (response.status === 400) {
      return response.json().then(data => data.errors);
    } else {
      throw new Error();
    }
  }

  /**
   * ✅ Delete a specific course with JWT (from HttpOnly cookie)
   */
  async deleteCourse(id) {
    const response = await fetch(config.apiBaseUrl + `/courses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      credentials: 'include', // ✅ Send HttpOnly JWT cookie
    });

    if (response.status === 204) {
      return [];
    } else if (response.status === 400) {
      return response.json().then(data => data.errors);
    } else {
      throw new Error();
    }
  }

  /**
   * ✅ Update a particular course with JWT (from HttpOnly cookie)
   */
  async updateCourse(id, course) {
    const response = await fetch(config.apiBaseUrl + `/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(course),
      credentials: 'include', // ✅ Send HttpOnly JWT cookie
    });

    if (response.status === 204) {
      return [];
    } else if (response.status === 400) {
      return response.json().then(data => data.errors);
    } else {
      throw new Error();
    }
  }

  /**
   * Send password reset request
   */
  async forgotPassword(emailAddress) {
    const response = await fetch(config.apiBaseUrl + '/password/forgot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ emailAddress }),
      credentials: 'include',
    });
    return response.json();
  }

  /**
   * Update user with Basic Auth
   */
  // async updateUser(user, emailAddress, oldPassword) {
  //   const encodedCredentials = btoa(`${emailAddress}:${oldPassword}`);
  //   const response = await fetch(config.apiBaseUrl + `/users`, {
  //     method: 'PUT',
  //     headers: {
  //       'Content-Type': 'application/json; charset=utf-8',
  //       'Authorization': `Basic ${encodedCredentials}`,
  //     },
  //     body: JSON.stringify(user),
  //     credentials: 'include',
  //   });

  //   if (response.status === 204) {
  //     return [];
  //   } else if (response.status === 400) {
  //     return response.json().then(data => data.errors);
  //   } else {
  //     throw new Error();
  //   }
  // }

  /**
   * Update user details (profile or password) using JWT for auth.
   * @param {object} payload - The data to update.
   *   - For profile: { firstName, lastName }
   *   - For password: { password, oldPassword }
   */
  async updateUser(payload) {
    const response = await this.api(
      '/users',
      'PUT',
      payload,
      false // No Basic Auth, relies on HttpOnly JWT cookie
    );

    if (response.status === 204) {
      return [];
    } else if (response.status === 400 || response.status === 401) {
      return response.json().then(data => {
        // Ensure the error format is consistent (array of messages)
        if (data.message) return [data.message];
        return data.errors || ['An unknown error occurred.'];
      });
    } else {
      throw new Error();
    }
  }

  /**
   * Verify password with Basic Auth
   */
  // async verifyPassword(password, emailAddress, currentPassword) {
  //   const encodedCredentials = btoa(`${emailAddress}:${currentPassword}`);
  //   const response = await fetch(config.apiBaseUrl + `/users/verify-password`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json; charset=utf-8',
  //       'Authorization': `Basic ${encodedCredentials}`,
  //     },
  //     body: JSON.stringify({ password }),
  //     credentials: 'include',
  //   });
  //   return response;
  // }

  async verifyPassword(password, emailAddress, currentPassword) {
    const response = await this.api(
      '/users/verify-password', 
      'POST', 
      { password }, 
      true, 
      { username: emailAddress, password: currentPassword }
    );
    console.log(response);
    return response;
  }

  async verify2FA(userId, token) {
    const response = await this.api(`/users/verify-2fa`, 'POST', { userId, token });
    return response;
  }

  /**
   * Login with 2FA token - returns JWT as HttpOnly cookie
   */
  async login2FA(userId, token) {
    const response = await fetch(config.apiBaseUrl + `/users/login-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ userId, token }),
      credentials: 'include', // ✅ Accept HttpOnly cookie
    });

    if (response.status === 200) {
      const data = await response.json();
      // ✅ JWT is now in HttpOnly cookie (automatic)
      console.log('✅ 2FA verified - JWT saved in secure HttpOnly cookie');
      return data.user;
    } else {
      return response.json().then(data => data);
    }
  }
}
