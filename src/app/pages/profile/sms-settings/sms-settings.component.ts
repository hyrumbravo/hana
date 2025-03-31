import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '@services/profile/profile.service';
import { BakcEndService } from '@/bakc-end.service';
import { ToastrService } from 'ngx-toastr';
import { smsSettings } from '@/utils/sms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sms-settings',
  templateUrl: './sms-settings.component.html',
  styleUrls: ['./sms-settings.component.scss']
})
export class SmsSettingsComponent implements OnInit {
  canAccessSmsSetting: Boolean = true;
  isSmsEnabled:Boolean = true;
  step1:Boolean = false;
  step0:Boolean = true;
  verifyOTP:Boolean = false
  loader:Boolean = false;
  noSettings:Boolean = true;
  userGroups = [];

  otp:any = null;
  timerInterval: any;
  timeLeft: number = 300; // 5 minutes in seconds
  currentUser:any;
  smsSetting:any;
  numberToVerify:string = null;
  numberError:string = '';
  refCode: string = null;
  form:FormGroup;
  
  constructor(
    private http: HttpClient,
    private profileService:ProfileService,
    private backService: BakcEndService,
    private toastr: ToastrService,
    private fb: FormBuilder) {
    
      this.form = fb.group({
      phoneNumber: [null, Validators.required],
      isVerified: [false, Validators.required],
      isEnabled: [null, Validators.required],
      lastFailedSmsSent: [null]
    })
   }

  ngOnInit(): void {
    this.getUserById()
  }

  getUserGroups(){
    this.backService.users().subscribe((data:any) => {
      this.userGroups = data.rows;
    });
  }

  /**
 * Get User By Id
 */
  getUserById() {
    this.loader = true
    this.currentUser = null;
    this.form.reset();
    this.profileService.getUser().subscribe(
      async (response: any) => {
        await this.getUserGroups();
        var userData = response?.rows.find((r) => r.id == localStorage.getItem('userID'))
        this.currentUser = userData.doc
        if(this.currentUser?.smsSetting){
          this.form.setValue(this.currentUser.smsSetting);
          this.noSettings = false;
        } else {this.noSettings = true;this.step0=true}
        this.loader = false
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  async sendOTP(){
      this.timerON() //initiate timer

      this.verifyOTP = true
      const payload = {
        'app_key': smsSettings.M360_APP_KEY,
        'app_secret': smsSettings.M360_APP_SECRET,
        'msisdn': this.numberToVerify,
        'shortcode_mask': smsSettings.shortcode_mask,
        'minute_validity': smsSettings.minute_validity,
        'content': 'Your One-Time-Pin is #{PIN} and valid for #{VALIDITY} minutes. Do not share with others. #{REFCODE}',
    };
    try {
        this.http.post(smsSettings.urlOTP, payload).subscribe(
            async (response:any) => {
              if(response.code == '201'){
                this.refCode = response.ref_code
              }
            });
    } catch (error) {
        throw error;
    }
  }

  async verifyOtpCode(code){
      const payload= {
        'app_key': smsSettings.M360_APP_KEY,
        'app_secret': smsSettings.M360_APP_SECRET,
        'ref_code': this.refCode,
        'pin':code
      };
      setTimeout(function(){ this.loader = true; },2000)

      try {
        this.http.post(smsSettings.urlVerify, payload).subscribe(
            async (response:any) => {
              if(response.code == '200'){
              this.toastr.success('User Number Verified. Updating Settings.');
              const payload = {
                phoneNumber: this.numberToVerify,
                isEnabled: true,
                isVerified: true,
                lastFailedSmsSent: null
              }
              this.currentUser['smsSetting'] = payload
              this.updateUser(this.currentUser);
              this.step0=false; this.step1=false;this.verifyOTP=false;
              }else {
                throw new Error('Verification failed'); // Reject the promise
              }
            });
    } catch (error) {
        console.log('Verify OTP Error Code: ', error.code)
        this.toastr.error(error.message)
        throw error;
    }
    }

  private async sendBroadcast(form, otp){
    const payload = {
      'app_key': smsSettings.M360_APP_KEY,
      'app_secret': smsSettings.M360_APP_SECRET,
      'msisdn': form.phoneNumber,
      'shortcode_mask': smsSettings.shortcode_mask,
      'content': `Your One-Time-Pin is ${otp} and valid for 5 minutes. Do not share with others.`,
      'is_intl': false,
    };

    try {
      this.http.post(smsSettings.urlBroadcast, payload).subscribe(
          async (response:any) => {
            if(response.code === 201) console.log('SMS Broadcast sent.')
            
          });
    } catch (error) {
        console.log('Verify OTP Error Code: ', error.code)
        this.toastr.error(error.message)
        throw error;
    }
  }

  async remove(){
    Swal.fire({
      icon: 'info',
      title: 'Are you sure you want to remove your phone number? This will also remove your current setting.',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then(async (result) => {
      if (result.isConfirmed) {
        let user = this.currentUser
        user.smsSetting = null
        await this.updateUser(user)
        Swal.fire('SMS Setting Removed!', '', 'success')
      }
    })  
  }

  async disable(){
    Swal.fire({
      icon: 'info',
      title: 'Are you sure you want to disable SMS Notifications?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then(async (result) => {
      if (result.isConfirmed) {
        let payload = this.form.value
        payload.isEnabled = false;
        let user = this.currentUser
        user.smsSetting = payload
    
        await this.updateUser(user)
        Swal.fire('SMS Setting Disabled!', '', 'success')
      }
    })  
  }

  async enable(){
    Swal.fire({
      icon: 'info',
      title: 'Are you sure you want to enable SMS Notifications?',
      showCancelButton: true,
      confirmButtonText: 'Yes',
    }).then(async (result) => {
      if (result.isConfirmed) {
        let payload = this.form.value
        payload.isEnabled = true;

        let user = this.currentUser
        user.smsSetting = payload
        await this.updateUser(user)
        Swal.fire('SMS Setting Enabled!', '', 'success')
      }
    })
  }

  async reVerify(){
    this.otp = Math.floor(100000 + Math.random() * 900000);
    await this.sendBroadcast(this.form.value, this.otp)
    this.reConfirm();
  }

  private reConfirm(){
    const formValue = this.form.value
    Swal.fire({
      title: `Please enter the OTP sent to ${formValue.phoneNumber}.`,
      input: 'number',
      inputAttributes: {
          autocapitalize: 'off',
      },
      showCancelButton: true,
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
      willClose: () => {
          clearInterval(this.timerInterval)
      },
      allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
      if (result.isConfirmed) {
          let timerInterval
          Swal.fire({
          icon: 'success',
          title: 'Success!',
          html: 'Updating Settings',
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
            const payload = {
              phoneNumber: formValue.phoneNumber,
              isEnabled: true,
              isVerified: true,
              lastFailedSmsSent: null
            }
            this.currentUser.smsSetting = payload
            this.updateUser(this.currentUser);
          }
          })
      }
  });
  }

  private updateUser(user){
    this.profileService.updateUser(user).subscribe(
      (response: any) => {
        if(response.ok){
          this.toastr.success('SMS Settings Updated.');
          this.getUserById()
        }
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  checkValidMobileNumber(event) {
    const inputValue = event.target.value;
    let error = '';

    if (!(/^\d+$/.test(inputValue))) {
      error = 'Invalid number.';
    } else if (inputValue.length !== 11) {
      error = 'Input should have exactly 11 digits.';
    } else if (!inputValue.startsWith('0')) {
      error = 'Number should start with 0.';
    }
  
    this.numberError = error;
  }
  
  timerON() { 
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        // Timer has reached 0, you can perform any actions here.
        clearInterval(this.timerInterval);
        this.loader = false;
        this.verifyOTP=false;
        this.step1=true
      }
    }, 1000);
  }

  formatTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  checkChangeNumber(): boolean {
    const oldNumber = this.currentUser?.smsSetting?.phoneNumber;
    const formNumber = this.form.get('phoneNumber').value 
    return oldNumber === formNumber;
  }

  getUserGroupName(id):string{
    let groupname = ''
    this.userGroups.forEach(x=>{
      if(x.id === id) groupname =  x.doc.group_name
    })
    
    return groupname
  }
}


