import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-card',
  imports: [],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss'
})
export class DashboardCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() description: string = '';
  @Input() iconClass: string = '';

}
