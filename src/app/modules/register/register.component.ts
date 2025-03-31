import {
    Component,
    OnInit,
    Renderer2,
    OnDestroy,
    HostBinding,
    ViewChild,
    ElementRef
} from '@angular/core';
import {UntypedFormGroup, UntypedFormControl, Validators, EmailValidator, FormBuilder} from '@angular/forms';
import {AppService} from '@services/app.service';
import {ToastrService} from 'ngx-toastr';
import { BakcEndService } from '@/bakc-end.service';
import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProfileService } from '@services/profile/profile.service';
import { LeaveService } from '@services/leave/leave.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
    @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
    // @HostBinding('class') class = 'register-box';
        
    private apiUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    private subscription: Subscription | undefined;
    
    public registerForm: UntypedFormGroup;
    public isAuthLoading = false;
    public isGoogleLoading = false;
    public isFacebookLoading = false;
    users = []
    employees = []
    otp = undefined;
    nextId = undefined;
    isFormChanged = false;
    signatureFile: any; 
    imageSrc: string | ArrayBuffer;

    constructor(
        private http: HttpClient,
        private renderer: Renderer2,
        private toastr: ToastrService,
        private profileService: ProfileService,
        private appService: AppService,
        private service: BakcEndService,
        private modalService: NgbModal,
        private router: Router,
        private fb: FormBuilder,
        private leaveService: LeaveService,

    ) {
        
        this.registerForm = fb.group({
            firstName: [null, Validators.required],
            lastName: [null, Validators.required],
            middleName: [null],
            email: [null, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
            leaveBalance: [null],
            branchId: [null],
            // password: [null, Validators.required],
            // retypePassword: [null, Validators.required],
            contact: [null, [Validators.required, Validators.pattern('[0-9 ]*')]],
            designation: [null],
            // setting_id: [null, Validators.required],
            isActive: [true],
            // position: new FormControl("", [Validators.required]),
            // employee_idno: new FormControl("", [Validators.required]),
            // employeeId: new FormControl("", [Validators.required]),
            department: [null],
            agreeTerms: [false],
            // isApprover: new FormControl("", [Validators.required]),
            // isApproverId: new FormControl("", [Validators.required]),
            serviceInformation:{
                dateHired: this.formatDate(new Date()),
            },
            _attachments:{

            }
        })
        
        this.registerForm.valueChanges.subscribe(() => {
            this.isFormChanged = true;
        });
    }

    ngOnInit() {
        this.renderer.addClass(
            document.querySelector('app-root'),
            'register-page'
        );
        this.service.allUsers().subscribe(
            (response: any) => {
              this.users = response?.rows
              console.log(this.users)
            },
            (error) => {
              this.toastr.error(error.error.reason)
            }
        )
        this.service.employee().subscribe(
            (response: any) => {
                this.employees = response?.rows
                this.getNextEmployeeId()
                console.log(this.employees)
            },
            (error) => {
              this.toastr.error(error.error.reason)
            }
        )
    }

    getNextEmployeeId(){
        const currentYear = new Date().getFullYear();
        const employeesHiredThisYear = this.employees.filter(employee => {
            if(employee.doc.serviceInformation){
                const hireYear = new Date(employee.doc.serviceInformation.dateHired).getFullYear();
                // employee.hireYear = hireYear
                return hireYear === currentYear;
            }
        });
        const numbersArray = [];

        for (let i = 1; i <= 100; i++) {
          numbersArray.push(i);
        }

        console.log(employeesHiredThisYear)
        const currentYearLastTwoDigits = new Date().getFullYear() % 100;
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const currentDay = new Date().getDate().toString().padStart(2, '0');
        const f = employeesHiredThisYear.length < 10 ? '0'+ (employeesHiredThisYear.length + 1).toString() : (employeesHiredThisYear.length + 1).toString()
        this.nextId = currentYearLastTwoDigits+'-'+currentMonth.toString()+currentDay.toString()+f;
        console.log(employeesHiredThisYear.length, this.nextId)
    }

    // async registerByAuth() {
    //     if (this.registerForm.valid) {
    //         this.isAuthLoading = true;
    //         // this.registerForm.get('creationDate').patchValue(Date.now())
    //         this.registerForm.patchValue({
    //             creationDate: Date.now(), 
    //           });
    //         console.log(this.registerForm.value)
    //         await this.appService.registerByAuth(this.registerForm.value);
    //         this.isAuthLoading = false;
    //     } else {
    //         this.toastr.error('Form is not valid!');
    //     }
    // }

    // async registerByGoogle() {
    //     this.isGoogleLoading = true;
    //     await this.appService.registerByGoogle();
    //     this.isGoogleLoading = false;
    // }

    // async registerByFacebook() {
    //     this.isFacebookLoading = true;
    //     await this.appService.registerByFacebook();
    //     this.isFacebookLoading = false;
    // }

    ngOnDestroy() {
        this.renderer.removeClass(
            document.querySelector('app-root'),
            'register-page'
        );

        
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    onSubmit() {
        this.isAuthLoading = true
        let formValues = this.registerForm.value
        formValues['setting_id'] = environment.defaultSetting;
        formValues['isActive'] = true;

        this.registerForm.patchValue({
            creationDate: new Date(), 
            attachment: {
                signature: this.signatureFile
            }
        });
        if(this.registerForm.valid){
            if(this.users.find((u) => u.doc.email == this.registerForm.controls.email.value)){
                this.toastr.error('Email has already been used.');
                this.isAuthLoading = false
            }
            else if(this.f.get('agreeTerms').value != true){
                this.toastr.error('You must agree to the terms.');
                this.isAuthLoading = false
            }
            else{
                this.sendOTP()
            }
        }
        else{
            this.registerForm.markAllAsTouched()
            this.isAuthLoading = false
        }
        console.log(this.registerForm.value)
    } 

    sendOTP(){
        let otpno = Math.floor(100000 + Math.random() * 900000);

        this.otp = otpno;

        var data = environment.otpService
        data.template_params = {
            'message': otpno,
            'email_to': this.registerForm.controls.email.value
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
                }
              },
              (error) => {
                if(error.status == 200){
                    this.otpSent();
                }
                else{
                    this.showErrorAlert(error);
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
            allowOutsideClick: () => !Swal.isLoading(),
            }).then((result) => {
            if (result.isConfirmed) {
                // OTP successfully validated, handle the next steps here
                console.log('OTP verified:', result.value);
                // this.registerForm.patchValue({
                //     id_no: this.nextId, 
                // });
                // this.registerForm.patchValue({
                //     mobileNumber: this.registerForm.get('contact').value
                // });
                var clone = this.registerForm.value
                clone.creationDate = Date.now(),
                clone.id_no = this.nextId,
                clone.mobileNumber = this.registerForm.get('contact').value,
                clone.setting_id = environment.defaultSetting
                clone.smsNotification = false
                clone.smsSetting = null
                clone._attachments = {
                    signature: this.signatureFile
                }
                console.log(clone)
                console.log(this.newEmployeeCard(clone, 'id'))
                this.service.addUser(clone).subscribe((x) => {
                    clone._attachments = undefined;
                    this.profileService.createEmployee(clone).subscribe((data: any) =>
                    {

                        let employeeCard = this.newEmployeeCard(clone, data.id)
                        if(employeeCard){
                        this.leaveService.addLeaveCard(employeeCard).subscribe((response:any)=>{
                            Swal.fire(
                                'Success!',
                                'Registration successful.',
                                'success'
                            ).then((result) => {
                                this.dismiss()
                                this.router.navigate(['/']);
                                this.isAuthLoading = false
                            })
                            }),
                            (error) => { console.log(error)}
                        }
                    })
                });
            }
            else{
                this.isAuthLoading = false
            }
        });
    }
    
    private showErrorAlert(error: any): void {
        console.log(error)
        Swal.fire('Error!', error.message, 'error');
    }

    dismiss() {
        this.modalService.dismissAll()
    }

    get f() {
        return this.registerForm
    }

    newEmployeeCard(row, id){
        return {
          "name": `${row.lastName}, ${row.firstName} ${(row.middleName!= null && row.middleName!="")?row.middleName:""}`,
          "employee_id": id,
          "position_title": null,
          "birthDate": null,
          "civilStatus": null,
          "monthlyRate": null,
          "salaryGrade": null,
          "salaryStep": null,
          "dateHired": null,
          "gsis": null,
          "tin": null,
          "vlBalance": 0,
          "slBalance": 0,
          "flBalance": 5,
          "totEQUIV": 0,
          "splBalance": 3,
          "card": [],
          "id_no": row.id_no,
          "department": null,
          "status": null
        }
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    saveSignature(e){
        const base64 = e.replace("data:image/png;base64,", "");
        const imageName = 'name.png';
        const imageBlob = this.dataURItoBlob(base64);
        const imageFile = new File([imageBlob], imageName, { type: 'image/png' });
        this.formatFile(imageFile)
        this.dismiss()

        console.log(this.signatureFile)
    }

    dataURItoBlob(dataURI) {
        const byteString = window.atob(dataURI);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const int8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
          int8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([int8Array], { type: 'image/png' });    
        return blob;
     }

    openModal(id){
        this.modalService.open(id, { backdrop: true, keyboard: true, animation: true, centered: true, size: 'md' })
    }

    openFileInput(): void {
        // Trigger a click event on the file input element
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        if (inputElement.files && inputElement.files.length > 0) {
            const selectedFile = inputElement.files[0];
            // Now you can do something with the selected file, such as uploading it to a server or processing it.
            console.log('Selected File:', selectedFile);
            this.formatFile(selectedFile)
            console.log(this.signatureFile)

        }
    }

    formatFile(file){
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            var dataUrl = reader.result;
            var imageUrl = dataUrl;
            this.imageSrc = dataUrl
            var imageHtml = '<img src="' + imageUrl + '">';

            if (imageUrl) {
                // const dataUrl = reader.result;
                const data = (<string>dataUrl).split(',')[1]

                const attachment = {
                    content_type: file.type,
                    data: data
                };


                const attachmentName = file.name;

                console.log(attachment)
                this.signatureFile = attachment
                this.toastr.success('Signature successfully attached!');
                // return attachment
                // imgatth = attachment;
            }
        }
    }
}
