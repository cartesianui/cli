import {ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { ListingControlsComponent, ENTITY_CONSTRUCTOR, RequestType, AppDatatableComponent } from '@cartesianui/common';
import { _Library_Sandbox } from '../../_library_.sandbox';
import { LISTING_IMPORTS } from '../../_library_.imports';
import { _IEntity_, _Entity_ } from '../../models';
import { _Entity_CreateComponent } from './create/create.component';
import { _Entity_EditComponent } from './edit/edit.component';

const childComponents = {
  createForm: { id: 'create', title: 'Create _TEntity_' },
  editForm: { id: 'edit', title: 'Edit _TEntity_' }
} as const;

type _Entity_ChildComponent = typeof childComponents;

@Component({
    selector: '_section_-_entity_-list',
    templateUrl: 'listing.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      ...LISTING_IMPORTS,
      AppDatatableComponent,
      _Entity_CreateComponent,
      _Entity_EditComponent
    ],
    providers: [
      {
        provide: ENTITY_CONSTRUCTOR,
        useValue: _Entity_
      }
    ],
    standalone: true
})
export class _Entity_ListingComponent extends ListingControlsComponent<_IEntity_, _Entity_ChildComponent> implements OnInit, AfterViewInit, OnDestroy {
  override childComponents: _Entity_ChildComponent = childComponents;

  public sb = inject(_Library_Sandbox);

  // handle busy state effect
  private readonly busyEffect = effect(() => {
    this.handleBusyState(this.sb._entityName_.getState());
  });

  // handle complete state effect
  private readonly completeEffect = effect(() => {
    if (!this.sb._entityName_.getCompleted()) return;
    this.sb._entityName_.clearRequestState(RequestType.Get);
  });

  ngOnInit(): void {
    this.loadEntityMetadata();
    this.initCriteria();
  }

  protected list(): void {
    this.sb._entityName_.fetchAll(this.criteria.httpParams());
  }

  onEdit(entity: _Entity_): void {
    this.sb._entityName_.select(entity);
    this.showChildComponent(this.childComponents.editForm, 'editForm');
  }

  onDelete() {
    if (this.selected.length > 0) {
       this.message.confirm('Are you sure you want to delete this record?', 'Confirm Deletion', (confirmed) => {
          if (confirmed) {
            this.sb._entityName_.delete(this.selected[0].id);
            this.selected = [];
          }
      });
    }
  }

  onSearch($event: { text: string }) {
    this.criteria.page(1);
    this.criteria.updateForm('name', $event.text);
  }

  onDateChange($event: { start: string, end: string }) {
    console.log($event);
  }
}
