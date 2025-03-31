import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormArray, FormControl, FormGroup, Validators, ValidatorFn } from '@angular/forms';
import { BakcEndService } from '@/bakc-end.service';
import { ProfileService } from '@services/profile/profile.service';
import { LeaveService } from '@services/leave/leave.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-sub-menu',
  templateUrl: './sub-menu.component.html',
  styleUrls: ['./sub-menu.component.scss']
})


export class SubMenuComponent implements OnInit{
  @ViewChild('userGroupsTable', { static: false }) userGroupsTable: any;
  @ViewChild('systemUsersTable', { static: false }) systemUsersTable: any;
  
  loading = false;
  isSubmitting: boolean = false;
  createForm!: FormGroup;
  dashboard: any;
  id: any;
  rev: any;
  display: any;
  editForm!: FormGroup;
  advanceForm!: FormGroup;
  dashboardArray!: any;
  fileArray!: any;
  profileArray!: any;
  perInfoArray!: any;
  familyArray!: any;
  educationArray!: any;
  jobArray!: any;
  civilArray!: any;
  workArray!: any;
  trainArray!: any;
  otherArray!: any;
  serviceArray!: any;
  attArray!: any;
  docArray!: any;
  taskArray!: any;
  healthArray!: any;
  discArray!: any;
  masterArray!: any;
  servRecArray!: any;
  disciplineArray!: any;
  clinicArray!: any;
  reportsArray!: any;
  users: any = [];
  list: any = [];
  
  dtOptionsUsers: any;
  dtOptionsGroups: any;
  
  form: any;
  editUserForm: any;
  positionsList:any = [];
  departments:any = [];
  nextId = undefined;
  employees: any;
  showEmployeeCheckbox: boolean = true;

  constructor(
    private profileService: ProfileService, 
    private backService: BakcEndService, 
    private leaveService: LeaveService, 
    private fb: FormBuilder, 
    private router: Router, 
    private modalService: NgbModal, 
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef) { 

    this.form = fb.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      middleName: [null],
      email: [null, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'), this.emailExistsValidator()]],
      contact: [null, [Validators.pattern('[0-9 ]*')]],
      designation: [null, Validators.required],
      setting_id: [null, Validators.required],
      isActive: [true],
      isEmployee: [true],
      department: [null],
      id_no: [null],
      smsNotification: [false],
      smsSetting: [null],
      creationDate: [null],
      serviceInformation:{
        dateHired: this.formatDate(new Date()),
      },
      user_id: [null],
    })

    this.editUserForm = fb.group({
      _id: [null],
      _rev: [null],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      middleName: [null],
      email: [null, [Validators.required, Validators.email, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')]],
      contact: [null, [Validators.pattern('[0-9 ]*')]],
      designation: [null, Validators.required],
      setting_id: [null, Validators.required],
      isActive: [true],
      isEmployee: [null],
      department: [null],
      id_no: [null],
      smsNotification: [null],
      smsSetting: [null],
      user_id: [null],
      creationDate: [null],
    })
  }

  onChange(name: string, isChecked: boolean) {
    const dashboard = (this.advanceForm.controls.name as FormArray);

    if (isChecked) {
      dashboard.push(new FormControl(name));
    } else {
      const index = dashboard.controls.findIndex(x => x.value === name);
      dashboard.removeAt(index);
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.getDepartments();
    this.getUsers();
    this.getGroups();
    this.getPositions();
    this.backService.employee().subscribe(
      (response: any) => {
          this.employees = response?.rows.filter(item => !(item.doc._id.includes('_design')));
          this.getNextEmployeeId()
          console.log(this.employees)
          this.loading = false; //endpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false; //endpoint
      }
    )
    
    this.createForm = new FormGroup({
      number: new FormControl("",),
      group_id: new FormControl(null, Validators.required),
      group_name: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
      inactive: new FormControl(""),
      permissions: new FormControl(""),
    });
  
    this.editForm = new FormGroup({
      group_id: new FormControl(null, Validators.required),
      group_name: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
      inactive: new FormControl(""),
      permissions: new FormControl(""),
    });
    this.advanceForm = this.fb.group({
      dashboard: this.fb.array([]),
    });
    
    this.dtOptionsGroups = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries',
      },
      pageLength: 10,
      ordering: false,
      paging: true,
      dom: 'Bfrtip',
      buttons: [
        { extend: 'print', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'copyHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'csvHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'excelHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
      ],
    };
    
    this.dtOptionsUsers = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries',
      },
      pageLength: 25,
      ordering: false,
      paging: true,
      dom: 'Bfrtip',
      buttons: [
        { extend: 'print', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'copyHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'csvHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
        { extend: 'excelHtml5', exportOptions: { columns: 'thead th:not(.noExport)' } },
      ],
    };
  }
  
  createGroup() {
    const group_id = this.createForm.value.group_id;
    const group_name = this.createForm.value.group_name;
    const description = this.createForm.value.description;
    const inactive = this.createForm.value.inactive ? '1' : '0';
    const permissions = this.createForm.value.permissions = permissionDefault()
    const createdAt = new Date().toISOString();  // Set current timestamp
    const updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)
    const postObject = {group_id: group_id, group_name: group_name, description: description, inactive: inactive, createdAt: createdAt, updatedAt: updatedAt, permissions:permissions}
    this.backService.addUserGroup(postObject).subscribe(data => {
      console.log("Warning",data);
      Swal.fire('Success!', 'The group has been Created!', 'success')
      this.createForm.reset()
      this.getGroups()
  
    });
  }

  getDepartments(){
    this.profileService.getDepartment().subscribe(
      (response: any) => {
        this.departments = response?.rows
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }
  
  getPositions(){
    this.backService.position().subscribe((data:any) => {
      this.positionsList = data.rows;
    })
  }
  getGroups(){
    this.loading = true;
    this.list = []
    this.backService.users().subscribe((data:any) => {
      console.log(data);
      this.list = data?.rows;
      this.list.sort((a, b) => {
          const dateA = new Date(a.doc.createdAt).getTime();
          const dateB = new Date(b.doc.createdAt).getTime();
          return dateB - dateA;  // Sort in descending order
        });
      // this.dtOptionsGroups = {
      //   language: {
      //     search: '',
      //     searchPlaceholder: 'Search',
      //     lengthMenu: 'Show _MENU_ entries'
      //   },
      //   pageLength: 10,
      //   ordering: false,
      //   paging: true,
      //   dom: 'Bfrtip',
      //   buttons: [
      //     {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //     {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //     {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //     {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      //   ]
      // }

      console.log("Display", this.list);
      this.loading = false;
    });
  }
  deleteGroup(id: any, rev: any) {
    this.backService.removeUserGroup(id, rev).subscribe(data => {
      console.log(data);
      Swal.fire('Success!', 'The group has been Deleted!', 'success')
      .then((result) => {
        this.getGroups()
      })
    });
  }
  editGroup() {
  const group_id = this.editForm.value.group_id;
  const inactive = this.editForm.value.inactive ? '1' : '0';
  const group_name = this.editForm.value.group_name;
  const description = this.editForm.value.description;
  const permissions = this.editForm.value.permissions;
  const updObject = {_id: this.id, 
    _rev: this.rev,
    group_id: group_id,
    inactive: inactive,
    group_name: group_name,
    description: description,
    permissions:permissions
  }
  this.backService.updateUserGroup(updObject, this.id).subscribe(data => {
    console.log(data);
    Swal.fire('Success!', 'The group has been Updated!', 'success')
      .then((result) => {
        this.getGroups()
      })
  });
}
toArray(File: object) {
return Object.keys(File).map(key => File[key])
}


open(data: any) {
  this.editForm.controls["group_id"].setValue(data.group_id)
  this.editForm.controls["inactive"].setValue(data.inactive == 1 ? true : false)
  this.editForm.controls["group_name"].setValue(data.group_name)
  this.editForm.controls["description"].setValue(data.description)
  this.editForm.controls["permissions"].setValue(data.permissions)
  this.id = data._id;
  this.rev = data._rev;
  console.log(this.editForm.value)
}

openModal(content) {
    this.modalService.open(content, { backdrop: false, centered: true, size: 'lg' })
  }
del(doc: any){
  this.id = doc._id;
  this.rev = doc._rev;
}
refresh() {
  this.router.navigate(['sub-menu-1']);
}

// refreshGroupList(){
//   this.loading = true
//   this.list = []
//   this.backService.group_settings().subscribe((data:any) => {
//     console.log(data);
//     this.list = data.rows;
//     this.loading = false
//   });
// }

submitJobOpening(){

}

get f() {
  return this.form
}

get e() {
  return this.editUserForm
}

dismiss() {
  // this.f.removeControl('_id')
  // this.f.removeControl('_rev')
  this.modalService.dismissAll()
}

getUsers() {
  this.loading = true;
  this.users = []
  this.backService.allUsers().subscribe((data: any) => {
    this.users = data?.rows.filter(item => !(item.doc._id.includes('_design')));
    
    this.users.sort((a, b) => {
      const dateA = new Date(a.doc.createdAt || 0).getTime(); // Default to 0 if missing
      const dateB = new Date(b.doc.createdAt || 0).getTime();
      return dateB - dateA;  // Sort in descending order
    });
    
    // this.dtOptionsUsers = {
    //   language: {
    //     search: '',
    //     searchPlaceholder: 'Search',
    //     lengthMenu: 'Show _MENU_ entries'
    //   },
    //   pageLength: 25,
    //   ordering: false,
    //   paging: true,
    //   dom: 'Bfrtip',
    //   buttons: [
    //     {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
    //     {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
    //     {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
    //     {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
    //   ]
    // }
    
    // Trigger change detection to ensure view updates
    this.cdr.detectChanges();
    
    console.log('Sorted Users:', this.users);
    this.loading = false;
  },
  (error) => {
    this.toastr.error(error.error.reason)
  }
  )
}

// bulkUpdateUsers(){
//   this.backService.addCreatedAtToAllDocs();
// }

saveUser() {
  if (this.isSubmitting) {
    return; // Prevents any further execution if form is already being submitted
  }

  if (this.form.valid) {
    this.isSubmitting = true;  // Set flag to true to indicate form is being submitted

    if (this.form.get('designation').value.toLowerCase() != 'department head' &&
      this.form.get('designation').value.toLowerCase() != 'division chief') {
      this.form.get('department').patchValue(null);
    }
    // if (this.form.get('isEmployee').value) this.form.get('id_no').patchValue(this.nextId);

    this.form.patchValue({
      creationDate: Date.now(),
    });

    var userFormData = this.form.value;

    // Add timestamps for createdAt and updatedAt
    userFormData.createdAt = new Date().toISOString();  // Set current timestamp
    userFormData.updatedAt = new Date().toISOString();  // Set updated timestamp (initially the same as createdAt)

    const clone = newEmployee(userFormData);
    const pos = this.positionsList.find(
      (x) => x.doc.position_name.toLowerCase() === clone.position_title.toLowerCase()
    );

    clone.id_no = this.nextId;
    clone.serviceInformation.position = pos != undefined ? pos.doc.position_name : null;

    this.profileService.createEmployee(newEmployee(clone)).subscribe({
      next: (employeeData: any) => {
        if (employeeData.ok) {
          userFormData.user_id = employeeData.id; //add employee _id in user data 
          this.backService.addUser(userFormData).subscribe({
            next: (userData) => {
              console.log('User created successfully:', userData);
              let employeeCard = newEmployeeCard(
                {
                  ...newEmployee(userFormData),
                  id_no: this.nextId,
                },
                employeeData.id
              );
  
              this.leaveService.addLeaveCard(employeeCard).subscribe({
                next: () => {
                  console.log('Employee Card Created');
    
                  Swal.fire('Success!', 'New user and employee have been added', 'success').then(() => {
                    this.getUsers();
                    this.form.reset();
                    this.dismiss();
                    this.isSubmitting = false; // Reset submission flag
                  });
                },
                error: (error) => {
                  console.error('Error creating Employee Card:', error);
                  this.isSubmitting = false; // Reset submission flag on error
                },
              });
            },
            error: (error) => {
              console.error('Error creating user:', error);
              this.isSubmitting = false; // Reset submission flag on error
            },
          });
        } else {
          console.error('Error creating employee:', employeeData.message);
          this.isSubmitting = false; // Reset submission flag on error
        }
      },
      error: (error) => {
        console.error('Error in createEmployee:', error);
        this.isSubmitting = false; // Reset submission flag on error
      },
    });
  } else {
    this.form.markAllAsTouched();
  }
}


updateUser(id){
  if(this.emailExistsValidatorEdit()){
    this.toastr.error('Email is already in use!')
  }else if(this.editUserForm.valid){
    var empData;

    // Check and handle matching user_id or id_no
    console.log(this.editUserForm.value)
    if (this.editUserForm.get('user_id').value == null ) {
      empData = this.employees.find(x => x.doc.id_no == this.editUserForm.get('id_no').value);
      if (empData && !empData.doc.user_id) {
        this.editUserForm.get('user_id').patchValue(empData.doc.user_id);
      }
    } else {
      empData = this.employees.find(x => x.doc._id == this.editUserForm.get('user_id').value);
      if (empData && !empData.doc.id_no) {
        empData = this.employees.find(x => x.doc.id_no == this.editUserForm.get('id_no').value);
      }
    }

    const designation = this.editUserForm.get('designation').value.toLowerCase();
    const isDepartmentHeadOrChief = designation === 'department head' || designation === 'division chief';

    if(!isDepartmentHeadOrChief){
      this.editUserForm.get('department').patchValue(null)
    }

    if(empData != undefined){
      var pos = this.positionsList.find(x=>x.doc.position_name.toLowerCase() === designation.toLowerCase())
      empData.doc.position_title = this.editUserForm.get('designation').value
      empData.doc.mobileNumber = this.editUserForm.get('contact').value
      empData.doc.serviceInformation.position = (pos != undefined)? pos.doc.position_name: null;

      if(!isDepartmentHeadOrChief){
        empData.doc.serviceInformation.department = null
      } else empData.doc.serviceInformation.department = this.editUserForm.get('department').value
    }

    this.backService.editUser(this.editUserForm.getRawValue(), id).subscribe(data => {
      if(data.ok && empData != undefined){
        console.log(empData.doc);
        this.profileService.updateEmployee(empData.doc).subscribe(response => {
         console.log('employee data')
        });
      }
       console.log("Warning",data);
      Swal.fire('Success!', 'User has been updated', 'success')
      .then((result) => {
        this.getUsers()
        this.dismiss()
      })
  
    });
  }
  else{
    this.editUserForm.markAllAsTouched()
  }
}

deleteUser(id, rev){
  Swal.fire({
    icon: 'info',
    title: 'Do you want to delete this user?',
    showCancelButton: true,
    confirmButtonText: 'Delete',
  }).then((result) => {
    if (result.isConfirmed) {
      this.backService.deleteUser(id, rev).subscribe(
        (response: any) => {
          Swal.fire('Deleted!', '', 'success')
          this.getUsers()
        },
        (error) => {
          this.toastr.error(error.error.reason)
        }
      )
    }
  });
}


editUser(content, data) {
  this.editUserForm.reset()
  Object.keys(data).forEach(key => {
    if (!this.editUserForm.contains(key)) {
      this.editUserForm.addControl(key, this.fb.control(null));
    }
  });
  this.editUserForm.patchValue(data)
  this.openModal(content)
}

getGroupName(id){
  var data = this.list.find((l) => l.id == id)
  if(data){
    return data.doc.group_name
  }
  else{
    return id
  }
}

formValidationEdit(){
  const { designation, department } = this.e.controls;

  if(designation.value != null){
    if(designation.value.toLowerCase() == 'department head' || designation.value.toLowerCase() == 'division chief'){
      return (department.value == '' || department.value == null);
    } else return false
  } else return true
}

formValidation(){
  const { designation, department } = this.f.controls;

  if(designation.value != null){
    if(designation.value.toLowerCase() == 'department head' || designation.value.toLowerCase() == 'division chief'){
      return (department.value == '' || department.value == null);
    } else return false
  } else return true
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

formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

emailExistsValidator():ValidatorFn {
  return (control: FormControl) => {
    const email = control.value;
    const emailExists = this.users?.find(user => user.doc.email === email);
    return emailExists ? { emailExists: true } : null;
  };
}

emailExistsValidatorEdit() { //checks if email is already in use/exists
  const email = this.editUserForm.get('email').value;
  const id = this.editUserForm.get('_id').value;

  const emailExists = this.users?.filter(user => user.doc.email === email);
  if(emailExists){
    let count = emailExists.filter(em => em.id != id)
    return (count.length >= 1)? true:false;
  } else return false
}

onGroupChange(): void {
  const selectedGroupId = this.form.get('setting_id')?.value;
  const selectedGroup = this.list.find(l => l.id === selectedGroupId);
  if (selectedGroup && (selectedGroup.doc.group_name.toLowerCase() === 'admin' || selectedGroup.doc.group_name.toLowerCase() === 'administrator')) {
    this.showEmployeeCheckbox = false;
    this.form.get('isEmployee')?.setValue(false);
    this.form.get('isEmployee')?.disable();
  } else {
    this.showEmployeeCheckbox = true;
    this.form.get('isEmployee')?.enable();
  }
}

}

function permissionDefault(){
  return {
    dashboard: true,
    profile: true,
    file_201: false,
    humanResource:false,
    recruitment:false,  
    leaves:false,  
    settings:false,

    employeeProfile: false,
    plantilla: false,
    serviceRecords: false,
    discipline: false,
    medical: false,
    appointments: false,
    
    reports: false,
    announcements: false,
    certifications: false,
    templates: false,
    evaluations: false,
    actions: false,
    requests: false,
    
    leaveApproval: false,
    leaveCredits: false,
    leaveSettings: false,
  
    application: false,
    requiredDocs: false,
  
    userRoles: false,
    tlogs: false,
    acl: false,
    positions: false,
    institutions: false,
  }  
}

function newEmployeeCard(row, id){
  return {
    "name": `${row.lastName}, ${row.firstName} ${(row.middleName!= null && row.middleName!="")?row.middleName:""}`,
    "employee_id": id,
    "position_title": row.designation,
    "birthDate": null,
    "civilStatus": null,
    "monthlyRate": 0,
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
    "department": row.department,
    "status": ""
  }
}

function newEmployee(row){
  return {
    "firstName"         : row.firstName,
    "lastName"          : row.lastName,
    "middleName"        : `${(row.middleName!= null && row.middleName!="")?row.middleName:""}`,
    "id_no"             : row.id_no,
    "position_title"    : row.designation,
    "branchId"          : null,
    "leaveBalance"      : null,
    "email"             : row.email,
    "mobileNumber"      : row.contact,
    "creationDate"      : row.creationDate,
    "serviceInformation": {
        "branch"        : null,
        "department"    : row.department,
        "position"      : null
    }
  }
}