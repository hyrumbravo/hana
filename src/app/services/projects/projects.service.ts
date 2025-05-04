import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin, catchError } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  // private projectBaseUrl = 'http://18.139.82.238:4000/database/projects';
  // private phaseBaseUrl = 'http://18.139.82.238:4000/database/project_phase';
  private projectBaseUrl = '/database/projects';
  private phaseBaseUrl = '/database/project_phase';




  headers = new HttpHeaders()
    .set('Authorization', `Basic ${btoa('admin:h@n@')}`) // Basic Auth
    .set('Content-Type', 'application/json');

  constructor(private http: HttpClient) {}

  // Fetch all projects
  getProjects(): Observable<any> {
    return this.http.get(`${this.projectBaseUrl}/_all_docs?include_docs=true`, { headers: this.headers });
  }




  


  
  

  // Create a new project
  createProject(projectData: any): Observable<any> {
    return this.http.post(this.projectBaseUrl, projectData, { headers: this.headers });
  }


// ✅ DELETE PROJECT BY projectId
  deleteProjectByProjectId(projectId: string): Observable<any> {
    const findUrl = `${this.projectBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev"]
    };

    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const project = response.docs[0]; // Assuming one project per projectId
          const deleteUrl = `${this.projectBaseUrl}/${project._id}?rev=${project._rev}`;
          return this.http.delete(deleteUrl, { headers: this.headers });
        } else {
          return of(null);
        }
      })
    );
  }


  // Fetch phases with Project ID
  getPhases(projectId: string): Observable<any> {
    const url = `${this.phaseBaseUrl}/_find`;
    const requestBody = {
      selector: {
        projectId: projectId
      },
      fields: ["_id", "phaseName", "startDate", "deadline", "percentage", "amountToBill","progress", "projectId", "milestones"]
    };
  
    return this.http.post(url, requestBody, { headers: this.headers });
  }



  // ✅ DELETE PHASES BY projectId
  deletePhasesByProjectId(projectId: string): Observable<any> {
    const findUrl = `${this.phaseBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev"]
    };

    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const deleteRequests = response.docs.map((phase: any) => {
            const deleteUrl = `${this.phaseBaseUrl}/${phase._id}?rev=${phase._rev}`;
            return this.http.delete(deleteUrl, { headers: this.headers });
          });

          return forkJoin(deleteRequests);
        } else {
          return of(null);
        }
      })
    );
  }

    // Save a new phase
  createPhase(phaseData: any) {
    return this.http.post(this.phaseBaseUrl, phaseData, { headers: this.headers });
  }

  updatePhase(phase: any): Observable<any> {
    const totalMilestones = phase.milestones.length;
    const progressPerMilestone = 100 / totalMilestones;
    let progressRemaining = phase.progress;

    
  
    phase.milestones = phase.milestones.map((milestone, index) => {
      let milestoneProgress = 0;
  
      if (progressRemaining > 0) {
        if (progressRemaining >= progressPerMilestone) {
          milestoneProgress = 100;
          progressRemaining -= progressPerMilestone;
        } else {
          milestoneProgress = (progressRemaining / progressPerMilestone) * 100;
          progressRemaining = 0;
        }
      }
  
      // Determine progress status
      let progressStatus = "Not Started";
      if (milestoneProgress === 100) {
        progressStatus = "Completed";
      } else if (milestoneProgress > 0 && milestoneProgress < 100) {
        progressStatus = "In Progress";
      }
  
      return {
        ...milestone,
        previous: Math.round(milestoneProgress),

        previousOld: milestoneProgress === 0 ? 0 : milestone.previousOld || 0,
        presentValue: milestoneProgress === 0 ? 0 : milestone.presentValue || 0,
        presentMilestoneDue: milestoneProgress === 0 ? 0 : milestone.presentMilestoneDue || 0,
        amountDue: milestoneProgress === 0 ? 0 : milestone.amountDue || 0,
        progress: progressStatus,
      };
    });
  
    return this.http.put(`${this.phaseBaseUrl}/${phase._id}`, phase, { headers: this.headers });
  }





  
  

  
  //get phases by ID for updating
  getPhaseById(phaseId: string): Observable<any> {
    return this.http.get(`${this.phaseBaseUrl}/${phaseId}`, { headers: this.headers });
  }


  updateFullPhase(phase: any): Observable<any> {
    return this.http.put(`${this.phaseBaseUrl}/${phase._id}?rev=${phase._rev}`, phase, {
      headers: this.headers
    });
  }

  updateProjectProgress(projectId: string): Observable<any> {
    const findUrl = `${this.projectBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      fields: ["_id", "_rev", "progress", "projectName", "projectDescription", "clientName", "startDate", "deadline", "totalAmount", "downPayment", "projectId", "downPaymentAmount", "totalBalanceAfterDownPayment","unallocatedPercentage","remainingTotalBalance"]
    };
  
    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        if (response.docs.length > 0) {
          const project = response.docs[0]; // Get the project document
  
          // Fetch all phases for the project
          return this.getPhases(projectId).pipe(
            switchMap((phaseResponse: any) => {
              let totalProgress = 0;
  
              if (phaseResponse.docs.length > 0) {
                phaseResponse.docs.forEach((phase: any) => {
                  const phaseContribution = (phase.progress / 100) * phase.percentage;
                  totalProgress += phaseContribution;
                });
              }
  
              const newProgress = Math.round(totalProgress);
  
              // Update the project's progress
              const updateUrl = `${this.projectBaseUrl}/${project._id}?rev=${project._rev}`;
              const updatedProject = { ...project, progress: newProgress };
  
              return this.http.put(updateUrl, updatedProject, { headers: this.headers });
            })
          );
        } else {
          return of(null);
        }
      })
    );
  }
  

  updateMilestone(phaseId: string, updatedMilestone: any): Observable<any> {
    const phaseUrl = `${this.phaseBaseUrl}/${phaseId}`;
  
    return this.http.get(phaseUrl, { headers: this.headers }).pipe(
      switchMap((phase: any) => {
        const milestoneIndex = phase.milestones.findIndex(
          (m: any) => m.name === updatedMilestone.name
        );
  
        if (milestoneIndex !== -1) {
          const updatedPhase = { ...phase };
          updatedPhase.milestones = [...phase.milestones];
  
          const originalMilestone = updatedPhase.milestones[milestoneIndex];
          updatedPhase.milestones[milestoneIndex] = {
            ...originalMilestone,
            previous: updatedMilestone.previous,
            present: updatedMilestone.present,
            presentValue: updatedMilestone.presentValue,
            previousOld: updatedMilestone.previousOld,
            amountDue: updatedMilestone.amountDue,
            presentMilestoneDue: updatedMilestone.presentMilestoneDue,
            progress: updatedMilestone.progress || originalMilestone.progress
          };
  
          // ✅ Calculate and update the phase progress here
          const totalPrevious = updatedPhase.milestones.reduce(
            (acc: number, m: any) => acc + (m.previous || 0),
            0
          );
          const averageProgress = totalPrevious / updatedPhase.milestones.length;
          updatedPhase.progress = Math.min(Math.round(averageProgress), 100);
  
          return this.http.put(
            `${this.phaseBaseUrl}/${updatedPhase._id}?rev=${updatedPhase._rev}`,
            updatedPhase,
            { headers: this.headers }
          );
        }
  
        return of(null); // Milestone not found
      })
    );
  }


  updateProjectAfterPhase(projectId: string, phasePercentage: number, amountToBill: number) {
    const findUrl = `${this.projectBaseUrl}/_find`;
    const requestBody = {
      selector: { projectId: projectId },
      limit: 1
    };
  
    return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
      switchMap((response: any) => {
        const project = response.docs[0];
        if (!project) return of(null);
  
        const updatedProject = {
          ...project,
          unallocatedPercentage: Math.max((+project.unallocatedPercentage || 0) - phasePercentage, 0),
          remainingTotalBalance: Math.max((+project.remainingTotalBalance || 0) - amountToBill, 0)
        };
  
        return this.http.put(`${this.projectBaseUrl}/${project._id}?rev=${project._rev}`, updatedProject, { headers: this.headers });
      })
    );
  }

    updateProjectAfterPhaseEdit(projectId: string, unallocatedPercentage: number, remainingTotalBalance: number) {
      const findUrl = `${this.projectBaseUrl}/_find`;
      const requestBody = {
        selector: { projectId: projectId },
        limit: 1
      };
    
      return this.http.post(findUrl, requestBody, { headers: this.headers }).pipe(
        switchMap((response: any) => {
          const project = response.docs[0];
          if (!project) return of(null);
    
          const updatedProject = {
            ...project,
            unallocatedPercentage: unallocatedPercentage.toFixed(2),
            remainingTotalBalance: Math.round(remainingTotalBalance)
          };
    
          return this.http.put(`${this.projectBaseUrl}/${project._id}?rev=${project._rev}`, updatedProject, { headers: this.headers });
        })
      );
    }
  
  
  




  



  


  

  
  
}
