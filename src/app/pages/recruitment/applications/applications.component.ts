import { Component, OnInit } from '@angular/core';
import { ProfileService } from '@services/profile/profile.service';
import { RecruitmentService } from '@services/recruitment/recruitment.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {

  dtOptions: any
  applications: any = []
  jobOpenings = []
  positions = []
  jobOpeningId = null
  branchId = null
  statusId = null

  constructor(
    private recruitmentService: RecruitmentService,
    private profileService: ProfileService,
    private toastr: ToastrService
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
    this.getPositions()
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

  /**
   * Get Positions
   */
  getPositions() {
    this.profileService.getPositions().subscribe(
      (response: any) => {
        this.positions = response?.rows
        this.getJobOpenings()
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

  /**
   * Get Job Openings
   */
  getJobOpenings() {
    this.recruitmentService.getJobOpenings().subscribe(
      (response: any) => {
        this.jobOpenings = response?.rows
        this.jobOpenings.forEach(data => {
          data.doc.positionName = this.getPositionName(data.doc.position)
        })
      },
      (error) => {
        this.toastr.error(error.error.reason)
      }
    )
  }

}
