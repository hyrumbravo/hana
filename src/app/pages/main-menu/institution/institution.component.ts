import { BakcEndService } from '@/bakc-end.service';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-institution',
  templateUrl: './institution.component.html',
  styleUrls: ['./institution.component.scss']
})
export class InstitutionComponent implements OnInit {
  @ViewChild('myInput')
  myInputVariable: ElementRef;
  res: any;
  data: any;
  form: any;
  imageUrl: any = '/assets/img/default-profile.png';
  file: File = null;

  constructor(private service: BakcEndService, private router: Router, private fb: FormBuilder, private http: HttpClient, private toastr: ToastrService) {

    this.form = fb.group({
      systemName: [null, Validators.required],
      headName: [null, [Validators.required, Validators.pattern('[a-zA-Z. ]*')]],
      institutionName: [null, Validators.required],
      acronym: [null, Validators.required],
      address: [null, Validators.required],
      contact: [null, [Validators.required, Validators.pattern('[0-9+ ]*')]],
      email: [null, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      facebook: [null],
      linkedIn: [null],
      _id: [null],
      _rev: [null],
      _attachments: [null],
    })

  }

  ngOnInit(): void {
    this.imageUrl = '/assets/img/default-profile.png';
    this.getData()
  }

  getData(){
    this.service.institutionData().subscribe(
      (response: any) => {
        this.res = response?.rows
        console.log(response)
        if(response?.rows.length > 0){
          this.data = response?.rows[0].doc
          this.form.patchValue(this.data)
          if(this.data._attachments){
            // console.log(this.data._attachments)
            var keys = Object.keys(this.data._attachments)
            var type = this.data._attachments[keys[0]].content_type
            this.http.get(environment.globalUrl + `/institution/${this.data._id}/${keys[0]}`, {
              responseType: 'blob',
              headers: {
                'Authorization': 'Basic ' + btoa('admin:h@n@')
              }
            })
            .toPromise().then(response => {
              var xx = URL.createObjectURL(response);
              this.imageUrl = (xx).toString()
            })
          }
        }
      },
      (error) => {
        this.toastr.error(error.error.reason)
      })
  }

  get f() {
    return this.form
  }

  onFileSelected(event) {
    var base64 =  '/assets/img/default-profile.png';
    const file = event.target.files[0];
    var filereader = new FileReader();
    filereader.readAsDataURL(file);
    filereader.onload = (evt) => {
      base64 = (evt.target.result).toString()
      this.imageUrl = base64
    }
    this.file = file;
    // this.uploadFile(file);
  }

  uploadFile(file: File) {
    var base64 = ''
    console.log(this.form.value)
    this.form.removeControl('_attachments');
    console.log(this.form.value)

    var filereader = new FileReader();
    filereader.readAsDataURL(file);
    filereader.onload = (evt) => {
      base64 = (evt.target.result).toString()
      this.imageUrl = base64
    }

    if (this.form.valid) {
      this.service.addAnnouncement(this.form.value).subscribe(
        (response: any) => {
          this.form.patchValue({_rev: response.rev})
          // Make an HTTP POST request to upload the file as an attachment
          this.http.put(environment.globalUrl + `/employees/${this.form.get('_id').value}/${file.name}?rev=${response.rev}`, file, {
            headers: {
              'Content-Type': file.type,
              'Authorization':  `Basic ${btoa('admin:h@n@')}`
            }
          }).subscribe((response : any) => {
            console.log(response);
            this.form.patchValue({_rev: response.rev})
            // Update the image URL to display the new profile picture
            this.imageUrl = base64;
          });
          this.toastr.success('Employee updated successfully.')
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    } else {
      this.toastr.error('Check if the required fields has value.')
      this.myInputVariable.nativeElement.value = "";
      this.form.markAllAsTouched()
    }
  
    
  }

  updateInstitution(){
    if(this.form.valid){
      console.log(this.form.value)
      if(this.file != null){
        this.form.removeControl('_attachments');
      }
      if(this.res.length == 0){
        this.form.removeControl('_id');
        this.form.removeControl('_rev');
        this.form.removeControl('_attachments');
        this.service.addInstitution(this.form.value).subscribe(
          (response: any) => {
            console.log(response)
            this.form.addControl('_id', this.fb.control(response.id));
            this.form.addControl('_rev', this.fb.control(response.rev));
            this.getData()
            if(this.file != null){
              this.uploadImage(response.rev)
            }
            else{
              this.toastr.success('Saved.')
            }
          },
          (error) => {
            this.toastr.error(error.error.reason)
          })
      }
      else{
        this.service.updateInstitution(this.form.value, this.f.get('_id').value).subscribe(
          (response: any) => {
            console.log(response)
            this.form.patchValue({_rev: response.rev})
            this.getData()
            if(this.file != null){
              this.uploadImage(response.rev)
            }
            else{
              this.toastr.success('Saved.')
            }
          },
          (error) => {
            this.toastr.error(error.error.reason)
          }
        )
      }
    }
    else{
      this.form.markAllAsTouched()
    }
  }

  uploadImage(rev){

    this.http.put(environment.globalUrl + `/institution/${this.form.get('_id').value}/${this.file.name}?rev=${rev}`, this.file, {
      headers: {
        'Content-Type': this.file.type,
        'Authorization':  `Basic ${btoa('admin:h@n@')}`
      }
    }).subscribe((response : any) => {
      console.log(response);
      this.getData()
      this.file = null;
      this.toastr.success('Saved.')
      // Update the image URL to display the new profile picture
    });

  }

}
