import { execSync } from 'child_process';

console.log('Running migrations...');
execSync('npm run migrate', { stdio: 'inherit' });

console.log('Running seeds...');
execSync('npm run seed', { stdio: 'inherit' });

console.log('Starting server...');
execSync('npm run start', { stdio: 'inherit' });