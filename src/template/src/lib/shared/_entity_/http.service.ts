import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IHttpService, HttpService, POST, GET, Body, Criteria, DefaultHeaders, RequestCriteriaOuput, Path, DELETE, PATCH, PUT } from '@cartesianui/core';
import { _Entity_ } from '../../models';

export type I_Entity_HttpServiceExtension = {};

@Injectable()
@DefaultHeaders({
  Accept: 'application/json',
  'Content-Type': 'application/json'
})
export class _Entity_HttpService extends HttpService implements IHttpService<_Entity_, I_Entity_HttpServiceExtension> {

  @GET('/_Pentity-name_')
  public getAll(@Criteria criteria: RequestCriteriaOuput): Observable<any> {
    return null;
  }

  @GET('/_Pentity-name_/{id}')
  public getById(@Path('id') id: string): Observable<any> {
    return null;
  }

  @POST('/_Pentity-name_')
  public create(@Body body: _Entity_): Observable<any> {
    return null;
  }

  @PATCH('/_Pentity-name_/{id}')
  public update(@Path('id') id: string, @Body body: Partial<_Entity_>): Observable<any> {
    return null;
  }

  @DELETE('/_Pentity-name_/{id}')
  public delete(@Path('id') id: string): Observable<any> {
    return null;
  }

}