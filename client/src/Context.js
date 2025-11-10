import React, { Component } from 'react';
import Cookies from 'js-cookie';
import Data from './Data';

const Context = React.createContext();

export class Provider extends Component {
  state = {
    // FIXED: getJSON() removed in js-cookie v3, use get() + JSON.parse()
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
    // Use the new signIn() from Data.js (handles 401 + 403 + lock message)
    const user = await this.data.signIn(emailAddress, password);

    // ✅ Successful login
    if (user && user.id) {
      const authenticatedUser = { ...user, password };
      this.setState({ authenticatedUser });
      Cookies.set('authenticatedUser', JSON.stringify(authenticatedUser), { expires: 1 });
    }

    // ❌ Return message (if account locked or invalid)
    return user;
  };

  /**
   * Sign out user
   */
  signOut = () => {
    this.setState({ authenticatedUser: null });
    Cookies.remove('authenticatedUser');
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

  login2FA = async (userId, token) => {
    const user = await this.data.login2FA(userId, token);
    return user;
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
