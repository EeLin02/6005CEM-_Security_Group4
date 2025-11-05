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

  render() {
    const { authenticatedUser } = this.state;
    const value = {
      authenticatedUser,
      data: this.data,
      actions: {
        signIn: this.signIn,
        signOut: this.signOut,
      },
    };
    return (
      <Context.Provider value={value}>
        {this.props.children}
      </Context.Provider>
    );
  }

  /**
   * Signs the user in by retrieving the user's details, setting the authenticatedUser state and browser cookies
   * @param {String} emailAddress 
   * @param {String} password 
   * @returns {Object} user
   */
  signIn = async (emailAddress, password) => {
  // 🔄 Use the new signIn() from Data.js (handles 401 + 403 + lock message)
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
   * Signs the user out by setting a null authenticated user and removing cookies
   */
  signOut = () => {
    this.setState({ authenticatedUser: null });
    Cookies.remove('authenticatedUser');
  }
}

export const Consumer = Context.Consumer;

/**
 * A higher-order component that wraps the provided component in a Context Consumer component.
 * @param {class} Component - A React component.
 * @returns {function} A higher-order component.
 */
export function withContext(Component) {
  return function ContextComponent(props) {
    return (
      <Context.Consumer>
        {context => <Component {...props} context={context} />}
      </Context.Consumer>
    );
  }
}

const contextObjects = { withContext, Context };
export default contextObjects;
