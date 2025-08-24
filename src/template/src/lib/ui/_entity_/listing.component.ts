import { Injector, ChangeDetectionStrategy, Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ListingControlsComponent, ENTITY_CONSTRUCTOR, RequestType } from '@cartesianui/common';
import { _Library_Sandbox } from '../../_library_.sandbox';
import { _IEntity_, _Entity_ } from '../../models';

const childComponents = {
  createForm: { id: 'create', title: 'Create _TEntity_' },
  editForm: { id: 'edit', title: 'Edit _TEntity_' }
} as const;

type _Entity_ChildComponent = typeof childComponents;

@Component({
  selector: 'bo-_entity_-list',
  templateUrl: 'listing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ENTITY_CONSTRUCTOR,
      useValue: _Entity_
    }
  ]
})
export class _Entity_ListingComponent extends ListingControlsComponent<_IEntity_, _Entity_ChildComponent> implements OnInit, AfterViewInit, OnDestroy {
  override childComponents: _Entity_ChildComponent = childComponents;

  constructor(
    injector: Injector,
    public sb: _Library_Sandbox,

  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadEntityMetadata();
    this.initCriteria();
    this.addSubscriptions();
  }

  protected addSubscriptions(): void {
    this.subscriptions.push(
      this.sb._entityName_.meta$.subscribe((meta: any) => {
        if (meta) {
          this.pagination = meta ? meta.pagination : null;
        }
      })
    );

    this.subscriptions.push(
      this.sb._entityName_.getState$.subscribe((state) => {
        this.handleBusyState(state);
        if (state.completed) {
          this.sb._entityName_.clearRequestState(RequestType.Get);
        }
      })
    );
  }

  protected list(): void {
    this.sb._entityName_.fetchAll(this.criteria);
  }

  onSearch($event: { text: string }) {
    this.criteria.page(1);
    this.criteria.setSearchField('name', $event.text);
    this.appendSearchCriteriaToUrl();
    this.list();
  }

  onDateChange($event: { start: string, end: string }) {
    console.log($event);
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
}
