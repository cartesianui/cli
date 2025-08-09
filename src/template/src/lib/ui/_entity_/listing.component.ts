import { Component, Injector, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ListingControlsComponent, ENTITY_CONSTRUCTOR } from '@cartesianui/common';
import { _Entity_Search } from '../../models';
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
  providers: [
    {
      provide: ENTITY_CONSTRUCTOR,
      useValue: _Entity_
    }
  ]
})
export class _Entity_ListingComponent extends ListingControlsComponent<_IEntity_, _Entity_Search, _Entity_ChildComponent> implements OnInit, AfterViewInit, OnDestroy {
  override childComponents: _Entity_ChildComponent = childComponents;

  constructor(
    injector: Injector,
    public sb: _Library_Sandbox,

  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initCriteria(_Entity_Search);
    this.addSubscriptions();
  }

  protected addSubscriptions(): void {
    this.subscriptions.push(
      this.sb._entityName_Meta$.subscribe((meta: any) => {
        if (meta) {
          this.pagination = meta ? meta.pagination : null;
        }
      })
    );
  }

  protected list(): void {
    this.startLoading();
    this.sb.fetchAll_Entity_(this.criteria);
  }

  edit(entity: _Entity_): void {
    this.sb.select_Entity_(entity);
    this.showChildComponent(this.childComponents.editForm);
  }

  search() {
    this.setPage(1);
    if (this.searchText) {
      this.criteria.where('name', 'like', this.searchText);
    } else {
      this.criteria.where('name', 'like', '');
    } // TODO: Remove where
    this.list();
  }

  onDelete() {
    if (this.selected.length > 0) {
      // do deletion stuff
    }
  }

  onCreated() {
    this.list();
    this.hideChildComponent(false);
  }

}
