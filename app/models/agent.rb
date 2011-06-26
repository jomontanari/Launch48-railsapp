class Agent < ActiveRecord::Base
    validates_uniqueness_of :code_name
end
