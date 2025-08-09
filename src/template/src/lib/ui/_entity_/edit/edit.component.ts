// edit.component.ts template
import { AfterViewInit, ChangeDetectionStrategy, Component, Injector, OnDestroy } from '@angular/core';
import { FormBaseComponent } from '@cartesianui/common';
import { RequestCriteria } from '@cartesianui/core';
import { _Library_Sandbox } from '../../../_library_.sandbox';
import { _Entity_, _Entity_Search } from '../../../models';

@Component({
  selector: 'bo-edit-_entity_-form',
  templateUrl: './edit.component.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class _Entity_EditComponent extends FormBaseComponent<_Entity_> implements AfterViewInit, OnDestroy {
  _entityName_: _Entity_;
  constructor(
    injector: Injector,
    protected sb: _Library_Sandbox
  ) {
    super(injector, _Entity_);
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.addSubscriptions();
  }

  private initForm(): void {
    this.formGroup = new this.entityConstructor({})?.form();
  }

  addSubscriptions() {
    this.subscriptions.push(
      this.sb._entityName_Selected$.subscribe((_entityName_: _Entity_) => {
        this._entityName_ = _entityName_;
        this.patchEntityToForm(_entityName_);
      })
    );
  }

  onSave(): void {
    if (this.formGroup.valid) {
      const updatedEntity = this.createEntityFromForm();
      this.sb.update_Entity_(this._entityName_?.id, updatedEntity);
    }
  }

}