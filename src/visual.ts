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
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";

import axios from 'axios';
import { isRequestOptions } from "openai/core";
axios.defaults.headers.common['Access-Control-Allow-Origin'] = 'https://tfm-llama.eastus2.inference.ml.azure.com';
const https = require('https');
//import { Configuration, OpenAIApi } from "openai";
//import readline from "readline";

//import OpenAI from 'openai';
//const openai = new OpenAI();

/*
process.env['OPENAI_API_KEY'] = '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';
const OpenAIApi = require('openai');
const openai = new OpenAIApi({
    api_Key: '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',
    dangerouslyAllowBrowser: true 
  });

  async function main(question: string) {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: question}],
      stream: false,
    });
    console.log(stream.choices[0].message.content)
    return stream.choices[0].message.content
  }
  
  function allowSelfSignedHttps(allowed) {
    if (allowed) {
      // Disable SSL certificate validation (use with caution, only for self-signed certificates)
      const agent = new https.Agent({  
        rejectUnauthorized: false
      });
  
      // Set the default agent for all requests made with axios
      axios.defaults.httpsAgent = agent;
    }
  }

*/


export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private textNode: Text;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private data: DataView;

    /*
    // Agrega una función para actualizar el texto del textboxElement
    private updateText =async (textboxElement: HTMLElement, question: string) => {
        // Puedes actualizar el texto según tus necesidades
        const newText = await main(question)
        textboxElement.innerText = newText;
    }

    */

    private updateTextLlama3 =async (textboxElement: HTMLElement, question: string) => {
      const axios = require('axios');

      // URL de la API de pruebas (JSONPlaceholder en este caso)
      const apiUrl = 'https://chatllmapi.azurewebsites.net/query_df';

      // Realizar la solicitud GET
      axios.get(apiUrl)
        .then(response => {
          // Manejar la respuesta exitosa
          console.log('Datos de la respuesta:', response);
          textboxElement.innerText = response.data
        })
        .catch(error => {
          // Manejar erroresx|
          console.error('Error al hacer la solicitud:', error.message);
          textboxElement.innerText = error.message
        });

        
    }

    private updateTextLlama =async (textboxElement: HTMLElement, question: string) => {
        // Puedes actualizar el texto según tus necesidades

          
        const url = 'https://tfm-llama.eastus2.inference.ml.azure.com/score';
        const api_key = 'A5l0o9pX87UcVjwnyvtLsw6JpWLNuQhR';
        //const url = 'http://127.0.0.1:8000/question_ptg'

        const data = {
            "input_data": {
              "input_string": [
                {
                  "role": "user",
                  "content": "I am going to Paris, what should I see?"
                },
                {
                  "role": "assistant",
                  "content": "Paris, the capital of France, is known for its stunning architecture, art museums, historical landmarks, and romantic atmosphere. Here are some of the top attractions to see in Paris:\n\n1. The Eiffel Tower: The iconic Eiffel Tower is one of the most recognizable landmarks in the world and offers breathtaking views of the city.\n2. The Louvre Museum: The Louvre is one of the world's largest and most famous museums, housing an impressive collection of art and artifacts, including the Mona Lisa.\n3. Notre-Dame Cathedral: This beautiful cathedral is one of the most famous landmarks in Paris and is known for its Gothic architecture and stunning stained glass windows.\n\nThese are just a few of the many attractions that Paris has to offer. With so much to see and do, it's no wonder that Paris is one of the most popular tourist destinations in the world."
                },
                {
                  "role": "user",
                  "content": "que es inteligencia artificial?"
                }
              ],
              "parameters": {
                "temperature": 0.6,
                "top_p": 0.9,
                "do_sample": true,
                "max_new_tokens": 200
              }
            }
          };

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + api_key,
            'azureml-model-deployment': 'llama-2-7b-chat-15'
        };
        

        axios.get(url, { params: data, headers })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });


        //const newText = await main(question)
        //textboxElement.innerText = newText;
    }


    private updateTextLlama4 =async () => {



      const data_test ={
        "question": "cuantas filas tiene",
        "data": {
          "columns": [
              {
                  "roles": {
                      "values": true
                  },
                  "type": {
                      "underlyingType": 1,
                      "category": null,
                      "primitiveType": 1,
                      "extendedType": 1,
                      "categoryString": null,
                      "text": true,
                      "numeric": false,
                      "integer": false,
                      "bool": false,
                      "dateTime": false,
                      "duration": false,
                      "binary": false,
                      "json": false,
                      "none": false
                  },
                  "displayName": "Market",
                  "queryName": "Storre_Overlap _and_KPI_Effect.CHAR_MARKET_SELECTION_NAME",
                  "expr": {
                      "_kind": 2,
                      "source": {
                          "_kind": 0,
                          "entity": "Storre_Overlap _and_KPI_Effect",
                          "variable": "s1",
                          "kind": 0
                      },
                      "ref": "CHAR_MARKET_SELECTION_NAME",
                      "kind": 2
                  },
                  "sort": 1,
                  "sortOrder": 0,
                  "rolesIndex": {
                      "values": [
                          0
                      ]
                  },
                  "index": 1,
                  "identityExprs": [
                      {
                          "_kind": 2,
                          "source": {
                              "_kind": 0,
                              "entity": "Storre_Overlap _and_KPI_Effect",
                              "kind": 0
                          },
                          "ref": "CHAR_MARKET_SELECTION_NAME",
                          "kind": 2
                      }
                  ]
              }
          ],
          "identity": [
              {
                  "identityIndex": 0
              }
          ],
          "identityFields": [
              {
                  "_kind": 2,
                  "source": {
                      "_kind": 0,
                      "entity": "Storre_Overlap _and_KPI_Effect",
                      "kind": 0
                  },
                  "ref": "CHAR_MARKET_SELECTION_NAME",
                  "kind": 2
              }
          ],
          "rows": [
              [
                  "Channel 1"
              ]
          ]
      }
      }


      const url = 'https://app-service-llm.azurewebsites.net/query_df_body';

      /*
      console.log("tipo data", typeof this.data)
      console.log("tipo table", typeof this.data.table)
      console.log("dataview funcion", this.data.table)

      const dataTableDictionary = JSON.parse(JSON.stringify(this.data.table));
      console.log("tipo table cambiado", typeof dataTableDictionary)
      console.log("tipo cambiado",  dataTableDictionary)
      */
      
      const input_text:HTMLTextAreaElement = this.target.querySelector('#input_text');
      const response_text:HTMLTextAreaElement = this.target.querySelector('#response_text');
      response_text.innerText = ""
      const question:string = input_text.value

      console.log("qquestions:", question)
      const data_test2 ={
        "question": question,
        "data": this.data.table
      }
      console.log("data_dicc:",data_test2)
      const data = {
        "data": data_test2
      };

      axios.post(url, data_test2)
        .then(response => {
          console.log("Respuesta:",response.data.replace(/\n/g, '<br>'))
          response_text.innerText = response.data
        })
        .catch(error => {
          console.error("error api", error);
          response_text.innerText = error
        });



    }

    constructor(options: VisualConstructorOptions) {
        
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.updateCount = 0;
        if (document) {


          this.target.innerHTML = 
          `<body>
              <div class="container">
                  <h1>Chat</h1>
                  <input type="text" id="input_text" placeholder="Escriba su pregunta aquí">
                  <button id = "btn_query">Consultar</button>
                  <div id="response_text" readonly></div>
              </div>
            <script src="script.js"></script>
          </body>`

          const btn_query = this.target.querySelector('#btn_query');
          if (btn_query) {
            btn_query.addEventListener('click', () => {
                  // Aquí puedes llamar a tu función hacerPregunta()
                  this.updateTextLlama4();
              });
          }
            /*
            const new_p: HTMLElement = document.createElement("p");
            new_p.appendChild(document.createTextNode("Update count test2:"));

            
            const new_em: HTMLElement = document.createElement("em");
            
            this.textNode = document.createTextNode(this.updateCount.toString());
            
            
            new_em.appendChild(this.textNode);
            new_p.appendChild(new_em);

            
            this.target.appendChild(new_p);
            */
           

            /*
            // Crear elementos de entrada (input) y un elemento de texto (textbox)
            const inputElement: HTMLInputElement = document.createElement("input");
            inputElement.type = "textarea";

            inputElement.style.width = "800px"
 
            

            // Crear un botón
            const updateButton: HTMLButtonElement = document.createElement("button");
            updateButton.textContent = "Buscar";
            

            const textboxElement: HTMLElement = document.createElement("p");
            textboxElement.appendChild(document.createTextNode(''))

            updateButton.addEventListener('click', () => this.updateTextLlama4(textboxElement, inputElement.value));

            this.target.appendChild(inputElement);
            this.target.appendChild(document.createElement("br"));
            this.target.appendChild(updateButton);
            this.target.appendChild(document.createElement("br"));
            this.target.appendChild(textboxElement);
            */

        }

        /*
        const openai = new OpenAI({
            apiKey: "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",
          });

        
        const chatCompletion = openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{"role": "user", "content": "Hello!"}], 
        });

        console.log(chatCompletion);
        

        */

      
        


        /*
        const apiKey = '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';  // Reemplaza con tu clave de API de OpenAI

        const apiUrl = 'https://api.openai.com/v1/engines/davinci/completions';

        const prompt = 'Que es inteligenci artificial?';

        fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            prompt: prompt,
            max_tokens: 50,  // Ajusta según tus necesidades
        }),
        })
        .then(response => response.json())
        .then(data => {
        console.log('Respuesta de OpenAI:', data);
        })
        .catch(error => {
        console.error('Error al hacer la solicitud a OpenAI:', error);
        });
        */

        /*
        const configuration = new Configuration({
            apiKey: "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",
        });

        const openai = new OpenAIApi(configuration);

        openai
        .createChatCompletion({
            model: "gpt-4-0314",
            messages: [{ role: "user", content: "Hello" }],
        })
        .then((res) => {
            console.log(res.data.choices[0].message.content);
        })
        .catch((e) => {
            console.log(e);
        });
        */

        // New (i.e., OpenAI NodeJS SDK v4)

        
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