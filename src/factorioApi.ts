import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import { FACTORIO_USERNAME, FACTORIO_PASSWORD } from './config';
import { FactorioGame } from './types';

let factorioToken: string | null = null;

export function authenticateFactorio(): Observable<string> {
    if (!FACTORIO_USERNAME || !FACTORIO_PASSWORD) {
        return throwError(() => new Error('FACTORIO_USERNAME or FACTORIO_PASSWORD not specified'));
    }

    return ajax({
        url: 'https://auth.factorio.com/api-login',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: FACTORIO_USERNAME, password: FACTORIO_PASSWORD }).toString()
    }).pipe(
        map(response => {
            if (Array.isArray(response.response) && response.response.length > 0) {
                return response.response[0];
            }
            throw new Error('Authentication failed');
        }),
        tap(token => {
            factorioToken = token;
            console.log('Successfully authenticated with Factorio');
        }),
        catchError(error => {
            console.error('Error authenticating with Factorio:', error);
            return throwError(() => error);
        })
    );
}

export function getFactorioServers(token: string): Observable<FactorioGame[]> {
    return ajax({
        url: `https://multiplayer.factorio.com/get-games?username=${FACTORIO_USERNAME}&token=${token}`,
        method: 'GET'
    }).pipe(
        map(response => response.response as FactorioGame[]),
        catchError(error => {
            console.error('Error fetching Factorio servers:', error);
            return throwError(() => error);
        })
    );
}