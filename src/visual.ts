/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";

import axios from 'axios';
import { isRequestOptions } from "openai/core";
axios.defaults.headers.common['Access-Control-Allow-Origin'] = 'https://tfm-llama.eastus2.inference.ml.azure.com';
const https = require('https');
let isExpanded = false;

var currentChat = "dataframe"; // Iniciar con el chat 1 como activo
var chatHistory = {
    "dataframe": [],
    "question": []
};


export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private textNode: Text;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private data: DataView;
    private host: IVisualHost;
    /*
    // Agrega una función para actualizar el texto del textboxElement
    private updateText =async (textboxElement: HTMLElement, question: string) => {
        // Puedes actualizar el texto según tus necesidades
        const newText = await main(question)
        textboxElement.innerText = newText;
    }

    */

    private switchChat(item) {
      var selectedItemValue = item.getAttribute('data-value');
      this.target.querySelectorAll('.selectable').forEach(el => {
        el.classList.remove('selected');
      })
      item.classList.add('selected');
      console.log("select item:", selectedItemValue)
      currentChat = selectedItemValue;
      this.loadChatHistory(); // Cargar el historial para el chat actual
    }

    private loadChatHistory() {
      var messagesDiv = this.target.querySelector("#messages");
      messagesDiv.innerHTML = '';
  
     
      chatHistory[currentChat].forEach(msg => {
          var msgDiv = document.createElement("div");
          msgDiv.textContent = msg.message;
          msgDiv.classList.add(msg.sender);
          messagesDiv.appendChild(msgDiv); 
      });
  
      messagesDiv.scrollTop = messagesDiv.scrollHeight; 
    }

    private get_endpoint(){
      var type_model:HTMLSelectElement= this.target.querySelector("#models");
      var type_query = currentChat
      var model_query = type_model.value + '-' + type_query
      console.log("Combinacion:", model_query)
      var endpoint = ''
      switch(model_query){
        case 'gpt_35-question':
          endpoint= 'question_gpt35';
          break;
        case 'gpt_35-dataframe':
          endpoint= 'query_json_gpt35';
          break;
        case 'llama2-question':
          endpoint= 'question_llama2';
          break;
        case 'llama2-dataframe':
          endpoint= 'query_json_llama2';
          break;
        case 'openai-dataframe':
          endpoint= 'query_json_openai';
          break;
      }
    
      console.log("Endpint:", endpoint)
      return endpoint
    }

    private sendMessage() {
      var input:HTMLInputElement = this.target.querySelector("#userInput");
      var userMessage = input.value.trim();
      if(userMessage !== "") {
  
          chatHistory[currentChat].unshift({ sender: "user", message: userMessage });
          this.loadChatHistory(); 
          input.value = "";
          this.execute_question(userMessage)
          //var resultado = this.execute_question(userMessage)
          console .log("despues de execute question:")
          //chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          //this.execute_question(userMessage).then(resultado => {
          //  console.log("despues de responder");
          //  chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          //  this.loadChatHistory()
          //})

      }
      
    }


    private execute_question(question){
      if (currentChat == "dataframe"){
        this.query_dataframe(question).then(resultado => {
          console.log("query dataframe resultado:", resultado);
          //chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          //this.loadChatHistory()
          chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          this.loadChatHistory()
          //return resultado
        })
      }else {
        this.llm_question(question).then(resultado => {
          console.log("query question llm");
          //chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          //this.loadChatHistory()
          chatHistory[currentChat].unshift({ sender: "bot", message: resultado });
          this.loadChatHistory()
          return resultado
        })
      }
    }

    private async llm_question(question){
      console.log("dentro de llm question")
      const url = 'https://app-service-llm.azurewebsites.net/'+ this.get_endpoint() ;
      const table = JSON.parse(JSON.stringify(this.data.table));
      const api_key = table.rows[0][table.rows[0].length-1].toString()
      const params = {
        question: question,
      };
      const header = {'x-api-key': api_key};
      
      /*
      axios.get(url, {params:params, headers: {'x-api-key': api_key}})
        .then(response => {
          // Maneja la respuesta
          return response.data
          console.log("Repuesta query llm:",response.data);
        })
        .catch(error => {
          // Maneja el error
          return "Error obteniendo la respuesta"
          console.error(error);
        });
        */

        try {
          const response = await axios.get(url, {params:params, headers: {'x-api-key': api_key}});
          console.log("Respuesta:", response.data.replace(/\n/g, '<br>'));
          return response.data;
        } catch (error) {
          console.error("error api", error);
          throw error;
        }
    }

    private async query_dataframe (question) {

      
      const url = 'https://app-service-llm.azurewebsites.net/'+ this.get_endpoint();

      console.log("qquestions:", question)
      const table = JSON.parse(JSON.stringify(this.data.table));
      const api_key = table.rows[0][table.rows[0].length-1].toString()
      console.log("key:", api_key)
      table.rows.forEach(function(row) {
        // Eliminar el último elemento del array actual
        row.pop();
      });
      table.columns.pop()
      
      console.log(table)
      const data_test2 ={
        "question": question,
        "data": table
      }
      console.log("data_dicc:",data_test2)
      const data = {
        "data": data_test2
      };

      
      const header = {headers: {'x-api-key': api_key}};
      console.log("Key:", api_key)

      try {
        const response = await axios.post(url, data_test2, header);
        console.log("Respuesta:", response.data.replace(/\n/g, '<br>'));
        return response.data;
      } catch (error) {
        console.error("error api", error);
        throw error;
      }


    }


    constructor(options: VisualConstructorOptions) {
        
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.updateCount = 0;

        if (document) {


          this.target.innerHTML = 
          `<head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
          </head>
          <body>
            
            <label id="list-container" for="models">
              <span>LLM Model</span>
              <select class= "list-models" name="models" id="models">
                <option value="openai">Open AI</option>
                <option value="gpt_35">GPT 3.5</option>
                <option value="llama2">Llama2</option>
              </select>
            </label>        
            <div id="chatbot" class="chatbot">
              <ul>
                  <li><a href="#" class="selectable selected" data-value="dataframe">Consulta Datos</a></li>
                  <li><a href="#" class="selectable" data-value="question">Consulta Descriptiva</a></li>
              </ul>
              <div id="messages" class="messages"></div>
              <input type="text" id="userInput" class="userInput" placeholder="Escribe tu mensaje aquí...">
              <button id = "btn_query">Enviar</button>
            </div>
          
          </body>`
          /*
          
          const btn_expandir = this.target.querySelector('#btn_query');
          if (btn_query) {
            btn_query.addEventListener('click', () => {
                  // Aquí puedes llamar a tu función hacerPregunta()
                  this.toggleExpand();
              });
          }
           */

          this.target.querySelectorAll('.selectable').forEach(item => {
            item.addEventListener('click', () => {
              this.switchChat(item);
            })});

          const btn_dataframe = this.target.querySelector('#btn_dataframe');
          if (btn_dataframe) {
            btn_dataframe.addEventListener('click', () => {
                  // Aquí puedes llamar a tu función hacerPregunta()
                  this.switchChat("Dataframe");
              });
          }

          const btn_question = this.target.querySelector('#btn_question');
          if (btn_question) {
            btn_question.addEventListener('click', () => {
                  // Aquí puedes llamar a tu función hacerPregunta()
                  this.switchChat("Question");
              });
          }

          const btn_query = this.target.querySelector('#btn_query');
          if (btn_query) {
            btn_query.addEventListener('click', () => {
                  // Aquí puedes llamar a tu función hacerPregunta()
                  this.sendMessage();
              });
          }
         
        }
    }
    
    private toggleExpand() {
      isExpanded = !isExpanded;
      if (isExpanded) {
          // Actualiza el tamaño del visual cuando está expandido
          this.target.style.width = "100%";
          this.target.style.height = "100%";
          // Actualiza el diseño para reflejar el estado expandido
          // por ejemplo, muestra más información o ajusta el diseño
      } else {
          // Restaura el tamaño del visual cuando está contraído
          this.target.style.width = "400px"; // ajusta el ancho según sea necesario
          this.target.style.height = "300px"; // ajusta la altura según sea necesario
          // Actualiza el diseño para reflejar el estado contraído
          // por ejemplo, oculta detalles o ajusta el diseño
      }
    }

    public update(options: VisualUpdateOptions) {
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);
        this.data = options.dataViews[0]
        console.log('Visual update', options);
        if (this.textNode) {
            this.textNode.textContent = options.dataViews[0].single.value.toString();
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        console.log(this.formattingSettings)
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}