import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '@services/profile/profile.service';
import { BakcEndService } from '@/bakc-end.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  loading = false;
  employees: any = []
  positions: any = []
  dtOptions: any
  currentUser:any = null;
  currentGroup:any = null;

  constructor(
    private service: BakcEndService,
    private profileService: ProfileService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.dtOptions = {
      language: {
        search: '',
        searchPlaceholder: 'Search',
        lengthMenu: 'Show _MENU_ entries'
      },
      pageLength: 10,
      ordering: false,
      paging: true,
      dom: 'Bfrtip',
      buttons: [
        {extend: 'print', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'copyHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'csvHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
        {extend: 'excelHtml5', exportOptions:{ columns: 'thead th:not(.noExport)' }},
      ]
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.getCurrentUser()
    this.getPositions()
  }

  getCurrentUser(){
    this.service.getSystemUser().subscribe(
      (response: any) => {
        this.currentUser = response?.rows[0].doc
        if(this.currentUser){
          this.service.getUserGroupbyId(this.currentUser.setting_id).subscribe(
            (response: any) => {
              this.currentGroup = response?.rows[0].doc
            })
        }
      })

  }

  /**
   * Get Positions
   */
  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.getEmployees()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }


  /**
   * Get Employees
   */
  getEmployees() {
    this.profileService.getEmployees().subscribe(
      (response: any) => {
        let list = response?.rows.filter(item => !(item.doc._id.includes('_design')));
        if(this.currentUser?.department != null){
          this.employees = list.filter(item => (item.doc.serviceInformation?.department?.includes(this.currentUser?.department)));
        } else {
          this.employees = list
        }

        this.employees.forEach(data => {
          data.doc.positionTitle = this.getPositionName(data.doc.serviceInformation?.position)
        });
        this.loading = false //endpoint
      },
      (error) => {
        this.toastr.error(error.error.reason)
        this.loading = false //endpoint
      }
    )
  }

  /**
   * Get Position Name
   */
  getPositionName(id) {
    for (let index = 0; index < this.positions?.length; index++) {
      if (this.positions[index].doc.position_name == id) {
        return this.positions[index].doc.position_name
      }
    }
  }

  navigate(id) {
    this.router.navigate(['/employee-profile/', {id: id}])
  }
}
