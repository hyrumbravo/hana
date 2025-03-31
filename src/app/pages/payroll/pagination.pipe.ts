import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate'
})
export class PaginationPipe implements PipeTransform {
  transform(array: any[], pageSize: number, pageIndex: number): any[] {
    if (!array) return [];
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return array.slice(start, end);
  }
}
