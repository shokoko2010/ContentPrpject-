
// This file will handle all communication with the new backend service.
// For now, it will contain mock data and functions.

import { User, Team } from '../types';

const MOCK_USER: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  teamId: 'team-1',
};

const MOCK_TEAM: Team = {
  id: 'team-1',
  name: 'Marketing Team',
  members: ['user-1', 'user-2'],
};

export const login = async (email: string, password: string): Promise<User> => {
  console.log(`Attempting to log in with email: ${email} and password: ${password}`);
  // In a real application, you would make an API call to your backend here.
  // For now, we'll just return the mock user.
  if (email === 'john.doe@example.com' && password === 'password') {
    return Promise.resolve(MOCK_USER);
  } else {
    return Promise.reject(new Error('Invalid credentials'));
  }
};

export const getUser = async (userId: string): Promise<User> => {
    // In a real application, you would make an API call to your backend here.
    // For now, we'll just return the mock user.
    if (userId === 'user-1') {
        return Promise.resolve(MOCK_USER);
    }
    return Promise.reject(new Error('User not found'));
}

export const getTeam = async (teamId: string): Promise<Team> => {
    // In a real application, you would make an API call to your backend here.
    if(teamId === 'team-1') {
        return Promise.resolve(MOCK_TEAM);
    }
    return Promise.reject(new Error('Team not found'));
}
