class AgentsController < ApplicationController
  # GET /agents
  # GET /agents.xml
  def index
    @agents = Agent.all

    respond_to do |format|
      format.html { render :json => @agents, :callback => params[:callback] }
      format.xml  { render :xml => @agents }
      format.json { render :json => @agents }
    end
  end

  # GET /agents/1
  # GET /agents/1.xml
  def show
    @agent = Agent.find(params[:id])

    respond_to do |format|
      format.html { render :json => @agent }
      format.xml  { render :xml => @agent }
    end
  end

  # GET /agents/new
  # GET /agents/new.xml
  def new
    @agent = Agent.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @agent }
    end
  end

  # GET /agents/1/edit
  def edit
    @agent = Agent.find(params[:id])
  end

  # POST /agents
  # POST /agents.xml
  def create
    @agent = Agent.new(params[:agent])

    respond_to do |format|
      if @agent.save
        format.html { render :notice => "created", :status => :created }
        #format.html { #redirect_to(@agent, :notice => 'Agent was successfully created.') }
        format.xml  { render :xml => @agent, :status => :created, :location => @agent }
        format.json { render :json => @items.to_json, :callback => params[:callback]}
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @agent.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /agents/1
  # PUT /agents/1.xml
  def update
    @agent = Agent.find(params[:id])

    respond_to do |format|
      if @agent.update_attributes(params[:agent])
        format.html { render :location => @agent, :status => :ok }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @agent.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /agents/1
  # DELETE /agents/1.xml
  def destroy
    @agent = Agent.find(params[:id])
    @agent.destroy

    respond_to do |format|
      format.html { redirect_to(agents_url) }
      format.xml  { head :ok }
    end
  end

  # GET /agents/find
  def find
    @matches = Agent.find_by_sql ["SELECT id, code_name FROM agents WHERE code_name = ?", params[:code_name] ]

    @matches.each do | match |
        @agent = Agent.find(match.id)
        render :json => @agent.to_json, :callback => params[:callback]
    end
  end
end
