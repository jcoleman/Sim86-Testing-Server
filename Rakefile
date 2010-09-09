require 'rubygems'
require 'rake'
require 'sprockets'
require 'juicer'
require 'fileutils'
require 'bind'
require 'find'

class String
  def to_a
    lines.to_a
  end
end

module JavascriptHelper
  ROOT_DIR      = File.expand_path(File.dirname(__FILE__))
  SRC_DIR       = File.join(ROOT_DIR, 'client')
  EJS_DIR       = File.join(SRC_DIR, 'ui/templates')
  TEMPLATE_DIR  = File.join(ROOT_DIR, 'tmp/templates')
  DIST_DIR      = File.join(ROOT_DIR, 'server/public/js')
  TMP_DIR       = File.join(ROOT_DIR, 'tmp')
  DOC_DIR       = File.join(ROOT_DIR, 'doc/javascript')
  
  def self.generate_doc(options = {})
    options = {
      :template       => 'lib/jsdoc-toolkit/templates/jsdoc',
      :recurse        => 3,
      :source_path    => SRC_DIR,
      :destination    => DOC_DIR
    }.merge(options)
    command = ["java -jar lib/jsdoc-toolkit/jsrun.jar lib/jsdoc-toolkit/app/run.js"]
    command << "-t=#{options[:template]}"
    command << "-r=#{options[:recurse]}"
    command << "'#{options[:source_path]}'"
    command << "-d='#{options[:destination]}'"
    command << '-p'
    
    `#{command.join(' ')}`
    `open #{File.join(options[:destination], 'index.html')}`
  end
  
  def self.sprocketize(options = {})
    JavascriptHelper.build_templates()
    
    options = {
      :destination    => File.join(DIST_DIR, "simulator.js"),
      :strip_comments => false
    }.merge(options)

    load_path = [SRC_DIR]
    secretary = Sprockets::Secretary.new(
      :root           => ROOT_DIR,
      :load_path      => load_path,
      :source_files   => [File.join(SRC_DIR, "**/*.js"), 
                          File.join(TEMPLATE_DIR, "*.js")],
      :strip_comments => options[:strip_comments]
    )

    secretary.concatenation.save_to(options[:destination])
  end
  
  def self.build_templates()
    # Create the template build directory if it doesn't exist
    FileUtils.makedirs(TEMPLATE_DIR)
    
    Find.find(SRC_DIR) do |path|
      if FileTest.file?(path)
        name = File.basename(path)
        if name =~ /\.ejs$/
          name = File.basename(path, '.ejs')
          
          # Process the template
          
          template_file = File.open(path)
          template = template_file.lines.collect do |line|
            "#{line.gsub('"', '\"').chomp}\\"
          end.join("\n")
          template_file.close
          
          template = '\\' if template.size == 0
         
          file_path = path.gsub(EJS_DIR + '/', '').split('/').join('_')
          puts "Building template: #{path} into #{file_path}"

          new_file = File.new( File.join(TEMPLATE_DIR, file_path.gsub('.ejs', '.js')), 'w' )
          puts "Outputting temporary file: #{new_file.path}"
          new_file.write("Sim.UI.Templates['#{file_path.gsub('.ejs', '')}'] = \"#{template}\n\";\n")
          new_file.close
        end
      end
    end
  end
  
  def self.bind(options = {})
    @events = []
    
    Bind::Listener.new(
      :paths => SRC_DIR,
      :interval => 1,
      :actions => [lambda do
        current_time = DateTime.now
        @events << current_time
        Thread.new(current_time) do |current_time|
          sleep(0.5)
          should_sprocketize = false
          Thread.critical = true
          unless @events.size > 1
            should_sprocketize = true
          end
          @events.delete_at(0)
          Thread.critical = false
          if should_sprocketize
            puts "Rebuilding..."
            JavascriptHelper.sprocketize()
            #{}`afplay data/built.aiff`
          end
        end
      end],
      :debug => $stdout).run!
  end
  
  def self.spec(options = {})
    `jspec run`
  end
end

module Sprockets
  class SourceLine
    def to_s(constants = source_file.environment.constants)
      line.gsub(/<%sprocket=(.*?)%>/) do
        constant = $1.strip
        if value = constants[constant]
          value
        else
          raise UndefinedConstantError, "couldn't find constant `#{constant}' in #{inspect}"
        end
      end
    end
  end
end

desc "Build the JavaScript to a single file."
task :build => [:build_javascript, :build_css] do
  
end

task :build_javascript do
  JavascriptHelper.sprocketize()
end

task :build_css do
  puts `juicer merge web-app/css/all.css --force`
end

desc "Compile the EJS files into real JavaScript files."
task :templates do
  JavascriptHelper.build_templates()
end

desc "Auto-build the JavaScript. Often."
task :autobuild => :build do
  JavascriptHelper.bind()
end

desc "Run the specs."
task :spec => :build do
  JavascriptHelper.spec()
end

namespace :doc do
  desc "Generate the documentation."
  task :build do
    JavascriptHelper.generate_doc()
  end
end
 
task :doc => ['doc:build']
