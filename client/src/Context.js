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
   * Verify user password
   */
  verifyPassword = async (password) => {
    console.log('verifyPassword in Context.js called');
    const response = await this.data.verifyPassword(
      password,
      this.state.authenticatedUser.emailAddress,
      this.state.authenticatedUser.password
    );
    return response;
  };

  /**
   * Update user information
   */
  updateUser = async (user, emailAddress, oldPassword) => {
    const response = await this.data.updateUser(
      user,
      emailAddress,
      oldPassword || this.state.authenticatedUser.password
    );
    if (response.length === 0) {
      const updatedAuthenticatedUser = {
        ...this.state.authenticatedUser,
        ...user,
      };
      if (user.password) {
        updatedAuthenticatedUser.password = user.password;
      }
      this.setState({ authenticatedUser: updatedAuthenticatedUser });
      Cookies.set('authenticatedUser', JSON.stringify(updatedAuthenticatedUser), { expires: 1 });
    }
    return response;
  };

  /**
   * Sign in user
   */
  signIn = async (emailAddress, password) => {
    const user = await this.data.signIn(emailAddress, password);
    if (user && user.id) {
      const authenticatedUser = { ...user, password };
      this.setState({ authenticatedUser });
      Cookies.set('authenticatedUser', JSON.stringify(authenticatedUser), { expires: 1 });
    }
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

  setAuthenticatedUser = (user, password) => {
    const authenticatedUser = { ...user, password };
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
      <Consumer>
        {(context) => <Component {...props} context={context} />}
      </Consumer>
    );
  };
}

const contextObjects = { withContext, Context };
export default contextObjects;
