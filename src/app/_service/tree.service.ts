import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { treeNode } from '../_models/treeNode';

@Injectable({
  providedIn: 'root',
})
export class TreeService {
  baseUrl = environment.baseApiUrl;
  constructor(private http: HttpClient) {}

  getTree() {
    return this.http.get(this.baseUrl + 'tree');
  }

  insertItem(node: treeNode) {
    return this.http.post(this.baseUrl + 'tree', node);
  }

  deleteNode(id: number) {
    return this.http.delete(this.baseUrl + 'tree/' + id.toString());
  }

  getNode(id: number) {
    return this.http.get(this.baseUrl + 'tree/' + id.toString());
  } 
  
  updateNode(node:treeNode){
    return this.http.put(this.baseUrl + 'tree/' ,node  )
  }
}