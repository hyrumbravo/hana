import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {ToastrService} from 'ngx-toastr';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AppService {
    public user: any = null;

    constructor(private http: HttpClient, private router: Router, private toastr: ToastrService) {}

    async loginByAuth({email, password}) {
        try {
          const url = environment.globalUrl + `/users/_design/views/_view/auth?key=[\"${email}\",\"${password}\"]`;
            const headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa('admin:h@n@')}`
              });
              
              this.http.get(url, { headers }).subscribe(
                  async (response) => {
                    console.log(response)
                      if(response['rows'].length != 0 ){
                        if(this.user = response['rows'][0].value){ //true
                            // const token = await Gatekeeper.loginByAuth(environment.authEmail, environment.authPassword);
                            // localStorage.setItem('token', token);
                            localStorage.setItem('userID', response['rows'][0].id);
                            // console.log(response['rows'][0].id)
                            await this.getProfile();
                            await this.GetUserPermissions();
                            this.router.navigate(['/']);
                        } else {
                            this.toastr.error("Inactive User"); 
                        }
                } else this.toastr.error("Incorrect Email/User");

            }, (error) => {console.error('Error:', error);});
        } catch (error) {
            this.toastr.error(error.message);
        }
    }

    async getProfile() {
        // try {
        //     this.user = await Gatekeeper.getProfile();
        // } catch (error) {
        //     this.logout();
        //     throw error;
        // }
        // console.log(this.user)
        if(!localStorage.getItem('userID')){
                // this.logout();

        }
        else{
            this.user = localStorage.getItem('userID')
        }
        // console.log(this.user)
    }

    logout() {
        const rememberMeValue = localStorage.getItem('rememberMe');
        const rememberEmailValue = localStorage.getItem('rememberEmail');

        localStorage.clear();

        if (rememberMeValue !== null) {
            localStorage.setItem('rememberMe', rememberMeValue);
            localStorage.setItem('rememberEmail', rememberEmailValue);
        } else localStorage.removeItem('rememberEmail');
        this.user = null;
        this.router.navigate(['/login']);
    }


    async GetUserPermissions(){
        let userId = localStorage.getItem('userID');
        const url = environment.globalUrl + `/users/_all_docs?include_docs=true&key=\"${userId}\"`;
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa('admin:h@n@')}`
          });
    
          try {
            this.http.get(url, { headers }).subscribe(
                async (response) => {
                    if(response['rows'].length != 0){
                        localStorage.setItem('settings', response['rows'][0]['doc'].setting_id)
                        localStorage.setItem('userID', response['rows'][0].id);
                    } else {
                        this.toastr.warning("Unable to retrieve User. Login Required.")
                        this.logout();
                    }
                });
        } catch (error) {
            this.logout();
            throw error;
        }
    }
    
    
    // Method to get user details by ID
  getUserDetailsById(userId: string): Observable<any> {
    const url = `${environment.globalUrl}/users/${userId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa('admin:h@n@')}`
    });
    return this.http.get(url, { headers });
  }
}
