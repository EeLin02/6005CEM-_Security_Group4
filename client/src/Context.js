import React, { Component } from 'react';
import Cookies from 'js-cookie';
import Data from './Data';

const Context = React.createContext();

export class Provider extends Component {
  state = {
    authenticatedUser: JSON.parse(Cookies.get('authenticatedUser') || 'null'),
  };

  constructor() {
    super();
    this.data = new Data();
  }

  /**
   * Verify user password - requires actual password input from user
   */
  verifyPassword = async (password) => {
    console.log('verifyPassword in Context.js called');
    const response = await this.data.verifyPassword(
      password,
      this.state.authenticatedUser.emailAddress,
      password
    );
    return response;
  };

  /**
   * Update user information
   */
  /**
   * Update user information (profile or password)
   * @param {object} payload - The data to update
   */
  updateUser = async (payload) => {
    const response = await this.data.updateUser(payload);
    if (response.length === 0) {
      // If it was a profile update, update the user in state
      if (!payload.password) {
        const updatedAuthenticatedUser = {
          ...this.state.authenticatedUser,
          ...payload,
        };
        this.setState({ authenticatedUser: updatedAuthenticatedUser });
        Cookies.set('authenticatedUser', JSON.stringify(updatedAuthenticatedUser), { expires: 1 });
      }
    }
    return response;
  };

  /**
   * Sign in user
   */
  signIn = async (emailAddress, password) => {
    // Use the new signIn() from Data.js (handles 401 + 403 + lock message)
    const user = await this.data.signIn(emailAddress, password);

    // Successful login
    if (user && user.id) {
      // Do not store password in cookie - security risk
      const authenticatedUser = { ...user };
      delete authenticatedUser.password; // Remove password field
      this.setState({ authenticatedUser });
      Cookies.set('authenticatedUser', JSON.stringify(authenticatedUser), { expires: 1 });
    }

    // Return message (if account locked/invalid)
    return user;
  };

  /**
   * Sign out user
   */
  signOut = () => {
    this.setState({ authenticatedUser: null });
    Cookies.remove('authenticatedUser');
    // ✅ Remove JWT token from localStorage
    localStorage.removeItem('jwtToken');
  };

  /**
   * ✅ Login with 2FA and store JWT token
   */
  login2FA = async (userId, token) => {
    const response = await this.data.login2FA(userId, token);
    
    // ✅ If response contains token, store it
    if (response && response.token) {
      localStorage.setItem('jwtToken', response.token);
      return response.user;  // Return user data
    }
    
    return response;
  };

  setAuthenticatedUser = (user) => {
    // Never accept password parameter
    const authenticatedUser = { ...user };
    delete authenticatedUser.password; // Remove password if present
    this.setState({ authenticatedUser });
    Cookies.set('authenticatedUser', JSON.stringify(authenticatedUser), { expires: 1 });
  };

  verify2FA = async (userId, token) => {
    const response = await this.data.verify2FA(userId, token);
    return response;
  };

  render() {
    const { authenticatedUser } = this.state;
    const value = {
      authenticatedUser,
      data: this.data,
      actions: {
        signIn: this.signIn,
        signOut: this.signOut,
        updateUser: this.updateUser,
        verifyPassword: this.verifyPassword,
        verify2FA: this.verify2FA,
        login2FA: this.login2FA,
        setAuthenticatedUser: this.setAuthenticatedUser,
      },
    };
    return <Context.Provider value={value}>{this.props.children}</Context.Provider>;
  }
}

export const Consumer = Context.Consumer;

/**
 * Higher-order component to inject context
 */
export function withContext(Component) {
  return function ContextComponent(props) {
    return (
      <Context.Consumer>
        {(context) => <Component {...props} context={context} />}
      </Context.Consumer>
    );
  };
}

const contextObjects = { withContext, Context };
export default contextObjects;
