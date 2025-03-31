import {
    Component,
    HostBinding,
    OnDestroy,
    OnInit,
    Renderer2
} from '@angular/core';
import {FormControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {ToastrService} from 'ngx-toastr';
import {AppService} from '@services/app.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BakcEndService } from '@/bakc-end.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

const url = 'https://api.emailjs.com/api/v1.0/email/send';
const headers = new HttpHeaders().set('Content-Type', 'application/json');

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
    @HostBinding('class') class = 'login-box';
    public forgotPasswordForm: UntypedFormGroup;
    public isAuthLoading = false;
    codeSent: Number;
    codeControl = new FormControl(null, [Validators.required]);
    newPass = new FormControl(null, [Validators.required]);
    newPass2 = new FormControl(null, [Validators.required]);
    status: Number = 1;
    users: [];
    userId: any;

    constructor(
        private renderer: Renderer2,
        private toastr: ToastrService,
        private router: Router,
        private appService: AppService,
        private service: BakcEndService,
        private http: HttpClient,
    ) {}

    ngOnInit(): void {
        this.renderer.addClass(
            document.querySelector('app-root'),
            'login-page'
        );

        this.service.allUsers().subscribe(
            (response: any) => {
              this.users = response?.rows
            },
            (error) => {
              this.toastr.error(error.error.reason)
            }
        )

        this.forgotPasswordForm = new UntypedFormGroup({
            email: new UntypedFormControl(null, Validators.required)
        });
    }

    forgotPassword() {
        if (this.forgotPasswordForm.valid) {
            let data = {
                id: '',
                doc: {
                    email: '',
                    isActive: false
                }
            }
            this.codeSent = Math.floor(100000 + Math.random() * 900000);
            data = this.users.find((u: any) => u.doc.email == this.forgotPasswordForm.get('email').value)
            // console.log(this.codeSent)
            // console.log(data)
            // console.log(this.forgotPasswordForm.get('email').value)
            if(data){
                if(data?.doc.isActive == true){
                    this.userId = data.id

                    var d = {
                        service_id: 'service_gv1k2zr',
                        template_id: 'template_6fuxuea',
                        user_id: 'user_sNpLqvGWjY804N36vRsSp',
                    
                        template_params: {
                        'message': this.codeSent,
                        'email_to': this.forgotPasswordForm.get('email').value
                        }
                    }
                    const dataString = JSON.stringify(d);
                    this.http.post(url, dataString, { headers }).subscribe((response) => {
                        // console.log(response)

                    
                    }, (error) => {
                        if(error.status == 200){
                            this.toastr.success('Success', 'OTP has been sent to your email.');
                            this.status = 2;
                        }
                        else{
                            // console.log(error)
                            this.toastr.error('Error', error);
                        }
                    
                        // setTimeout(() => {
                        //     window.location.reload();
                        // }, 2000);
                    
                    });
                }
                else{
                    this.toastr.error('Error', 'User is currently set as inactive.');
                }
            }
            else{
                this.toastr.error('Error', 'Email not found');
            }
        } else {
            this.toastr.error('Error!', 'Invalid email.');
        }
    }

    checkCode(){
        if(this.codeControl.value != this.codeSent){
            this.toastr.error('Error!', 'Wrong verification code.');
        }
        else{
            this.toastr.success('Success', 'Verification successful.');
            this.status = 3;
        }
        // console.log(this.codeControl.value, this.codeSent)
    }

    savePass(){
        if(this.newPass.value != this.newPass2.value){
            this.toastr.error('Error!', 'Password does not match.');
        }
        else{
            let data = {
                id: '',
                doc: {
                    password: '',
                    retypePassword: ''
                }
            }
            data = this.users.find((u: any) => u.id == this.userId)
            data.doc.password = this.newPass.value;
            data.doc.retypePassword = this.newPass2.value;
            this.service.editUser(data.doc, this.userId).subscribe(data => {
                Swal.fire(
                    'Success!',
                    'Password has been updated.',
                    'success'
                ).then((result) => {
                    this.router.navigate(['/']);
                    // window.location.reload()
                });
            });
        }
    }

    ngOnDestroy(): void {
        this.renderer.removeClass(
            document.querySelector('app-root'),
            'login-page'
        );
    }
}
