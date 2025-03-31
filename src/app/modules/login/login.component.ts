import {
    Component,
    OnInit,
    OnDestroy,
    Renderer2,
    HostBinding
} from '@angular/core';
import {UntypedFormGroup, UntypedFormControl, Validators} from '@angular/forms';
import {ToastrService} from 'ngx-toastr';
import {AppService} from '@services/app.service';
import { BakcEndService } from '@/bakc-end.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { CreditEarningService } from '@services/leave/credit-earning.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    @HostBinding('class') class = 'login-box';
    
    private apiUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    private subscription: Subscription | undefined;
    
    public loginForm: UntypedFormGroup;
    public isAuthLoading = false;
    public isGoogleLoading = false;
    public isFacebookLoading = false;
    insData: any;
    logo: any = '/assets/img/HR-LOGO-1024x1024.png';
    otp: number;
    users: any;
    userID: any;
    remember: boolean = false;

    constructor(
        private renderer: Renderer2,
        private toastr: ToastrService,
        private appService: AppService,
        private ceService: CreditEarningService,
        private http: HttpClient,
        private service: BakcEndService,
        private router: Router
    ) {}

    ngOnInit() {
        // localStorage.clear() //moved to app-service - logout()
        this.service.institutionData().subscribe((res : any) => {
            if(res.rows.length == 0){
                this.insData = {
                    "systemName": "HRMS",
                    "headName": "Province of Sorsogon",
                    "institutionName": "Human Resource Management Office",
                    "acronym": "HRMO",
                    "address": "Capitol Building, Capitol Compound, Barangay Burabod, Sorsogon City 4700 Province of Sorsogon",
                    "contact": "09123456789",
                    "email": "prov_hrmo@sorsogon.gov.ph",
                }
            }
            else{
                this.insData = res.rows[0].doc
            }
            if(this.insData._attachments){
                var keys = Object.keys(this.insData._attachments)
                var type = this.insData._attachments[keys[0]].content_type
                this.http.get(environment.globalUrl + `/institution/${this.insData._id}/${keys[0]}`, {
                    responseType: 'blob',
                    headers: {
                        'Authorization': 'Basic ' + btoa('admin:h@n@')
                    }
                    })
                    .toPromise().then(response => {
                    var xx = URL.createObjectURL(response);
                    this.logo = (xx).toString()
                })
            }
        })
        this.renderer.removeClass(
            document.querySelector('app-root'),
            'layout-fixed'
        );
        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(null, Validators.required),
            // password: new UntypedFormControl(null, Validators.required)
        });
        this.service.allUsers().subscribe(
            (response: any) => {
              this.users = response?.rows
            //   console.log(this.users)
            },
            (error) => {
              this.toastr.error(error.error.reason)
            }
        )

        const rememberMe = localStorage.getItem('rememberMe');
        const rememberEmail = localStorage.getItem('rememberEmail');
        if (rememberMe === 'true' && rememberEmail) {
            this.loginForm.get('email').setValue(rememberEmail);
            this.remember = true;
        }
    }

    keyDownFunction(event) {
        if (event.keyCode === 13) {
            this.loginByOTP()
        //   alert('you just pressed the enter key');
          // rest of your code
        }
    }

    async loginByOTP() {
        if (this.loginForm.valid) {
            this.isAuthLoading = true;
            var userData = this.users.find((u: any) => u.doc.email == this.loginForm.controls.email.value)
            if(userData){
                this.userID = userData.id
                this.isAuthLoading = true;
                this.sendOTP()
            }
            else{
                this.toastr.error('Email not found.');
                this.isAuthLoading = false;
            }
        } else {
            this.toastr.error('Form is not valid!');
        }
    }

    sendOTP(){
        let otpno = Math.floor(100000 + Math.random() * 900000);

        this.otp = otpno;

        var data = environment.otpService
        data.template_params = {
            'message': otpno,
            'email_to': this.loginForm.controls.email.value
        }

        this.sendEmail(data)

    }

    
    sendEmail(data): void {
        this.subscription = this.http
        .post(this.apiUrl, JSON.stringify(data), { headers: this.headers })
        .subscribe(
            (response: any) => {
                if (response === 'OK') {
                  this.showSuccessAlert();
                  // Perform other actions after success (e.g., show OTP, hide elements, etc.)
                } else {
                  this.showErrorAlert(response);
                  this.isAuthLoading = false;
                }
              },
              (error) => {
                if(error.status == 200){
                    this.otpSent();
                }
                else{
                    this.showErrorAlert(error);
                    this.isAuthLoading = false;
                }
            }
      );
    }

    private showSuccessAlert(): void {
        Swal.fire('Success!', 'Registration successful!', 'success').then(() => {
          // Perform actions after the success alert is closed
        });
    }

    private otpSent(): void {
        Swal.fire({
            title: 'Please enter the OTP sent to your email.',
            input: 'number',
            inputAttributes: {
                autocapitalize: 'off',
            },
            showCancelButton: false,
            confirmButtonText: 'Submit',
            showLoaderOnConfirm: true,
            preConfirm: (otp) => {
                return new Promise((resolve) => {
                // Replace this with your actual OTP verification logic
                setTimeout(() => {
                    if (otp == this.otp) {
                        resolve({ valid: true });
                    } else {
                        Swal.showValidationMessage('Wrong OTP. Try Again.');
                        resolve({ valid: false });
                    }
                    console.log(otp, this.otp)
                }, 1000);
                });
            },
            allowOutsideClick: false,
            allowEscapeKey: false,
            }).then((result) => {
            if (result.isConfirmed) {
                let timerInterval
                Swal.fire({
                icon: 'success',
                title: 'Success!',
                html: 'Logging in.',
                timer: 2000,
                timerProgressBar: true,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                    const b = Swal.getHtmlContainer().querySelector('b')
                    if (b) {
                        timerInterval = setInterval(() => {
                            b.textContent = (Swal.getTimerLeft()).toString();
                        }, 100);
                    }
                },
                willClose: () => {
                    clearInterval(timerInterval)
                }
                }).then((result) => {
                /* Read more about handling dismissals below */
                if (result.dismiss === Swal.DismissReason.timer) {
                    if(this.remember) localStorage.setItem('rememberEmail', this.loginForm.controls.email.value)
                    this.isAuthLoading = false;
                    localStorage.setItem('userID', this.userID);
                    // this.appService.GetUserPermissions()
                    this.ceService.creditEarning() //credit-earning service
                    this.router.navigate(['/']);
                }
                })
            }
        });
    }
    
    private showErrorAlert(error: any): void {
        console.log(error)
        Swal.fire('Error!', error.message, 'error');
    }


    ngOnDestroy() {
        this.renderer.removeClass(
            document.querySelector('app-root'),
            'login-page'
        );

        
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    toggleRememberMe(event:any){
        this.remember = (event.target.checked);
        this.remember? localStorage.setItem('rememberMe', 'true'): localStorage.removeItem('rememberMe');
    }
}
