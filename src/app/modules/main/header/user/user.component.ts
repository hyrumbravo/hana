import {Component, OnInit} from '@angular/core';
import {AppService} from '@services/app.service';
import { BakcEndService } from '@/bakc-end.service';
import {DateTime} from 'luxon';
import { environment } from 'environments/environment';
import { HttpClient, HttpEventType  } from '@angular/common/http';
import { ObjService } from '@services/obj-pass/obj.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
    public user;
    public display_user;
    profilePic: any;
    employees: any;
    private subscription: Subscription;

    constructor(private appService: AppService, private backEndService: BakcEndService, private http: HttpClient, private objService: ObjService) {

        this.subscription = this.objService.sharedMessage$.subscribe(
            (message) => {
              this.profilePic = message;
            }
        );

    }

    ngOnInit(): void {
        this.user = this.appService.user;
        this.display_user = this.backEndService.getSystemUser().subscribe(
            async (response) => {
                this.display_user = response['rows'][0].doc
                if(this.display_user.id_no){
                    this.backEndService.getEmployeeById(this.display_user.id_no).subscribe(
                        (data) => {
                            if (data.docs && data.docs.length > 0) {
                              this.getImage(data.docs[0])
                            }
                            else{
                                this.objService.updateMessage('assets/img/default-profile.png');
                            }
                          },
                          (error) => {
                            console.error('Error fetching employee data:', error);
                          }
                    )
                }
            });
        
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    logout() {
        this.appService.logout();
    }

    formatDate(date) {
        return DateTime.fromISO(date).toFormat('dd LLL yyyy');
    }


    getImage(data){
        if(data._attachments){
            if('profilePic' in data._attachments){
                this.http.get(environment.globalUrl + `/employees/${data._id}/profilePic`, {
                  responseType: 'blob',
                  headers: {
                    'Authorization': 'Basic ' + btoa('admin:h@n@')
                  }
                })
                .toPromise().then(response => {
                  var xx = URL.createObjectURL(response);
                  this.objService.updateMessage((xx).toString());
                })
            }
            else{
                this.objService.updateMessage('assets/img/default-profile.png');
            }
        }
        else{
            this.objService.updateMessage('assets/img/default-profile.png');
        }
    }
}
